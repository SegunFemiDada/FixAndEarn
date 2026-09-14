import {
  DetectDocumentTextCommand,
  TextractClient,
} from "@aws-sdk/client-textract";
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";

import { OcrProvider } from "./ocr.provider";

type OcrLine = {
  text: string;
  index: number;
};

@Injectable()
export class TextractOcrProvider implements OcrProvider {
  private readonly client: TextractClient;

  constructor() {
    const region = process.env.AWS_REKOGNITION_REGION;

    if (!region) {
      throw new Error(
        "AWS_REKOGNITION_REGION is not configured",
      );
    }

    this.client = new TextractClient({
      region,
    });
  }

  private async downloadImage(imagePath: string): Promise<Buffer> {
    let url: URL;

    try {
      url = new URL(imagePath);
    } catch {
      throw new InternalServerErrorException(
        "Invalid NIN image URL",
      );
    }

    if (url.protocol !== "https:") {
      throw new InternalServerErrorException(
        "NIN image must use HTTPS",
      );
    }

    if (!url.hostname.endsWith(".cloudinary.com")) {
      throw new InternalServerErrorException(
        "NIN image provider is not allowed",
      );
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new InternalServerErrorException(
        "Unable to retrieve NIN image",
      );
    }

    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * Extract an 11-digit number from one OCR text fragment.
   *
   * Examples accepted:
   * 66412345622
   * 66412 345622
   * 66412-345622
   */
  private extractElevenDigitCandidates(text: string): string[] {
    const candidates = new Set<string>();

    /*
     * First detect digit groups which may contain OCR-added
     * spaces or hyphens, but do not allow arbitrary text between
     * the digits.
     */
    const matches =
      text.match(
        /(?<!\d)(?:\d[\s-]*){11}(?!\d)/g,
      ) ?? [];

    for (const match of matches) {
      const digits = match.replace(/\D/g, "");

      if (digits.length === 11) {
        candidates.add(digits);
      }
    }

    /*
     * Also accept a clean 11-digit number directly.
     * This keeps the intention obvious and protects against
     * regex edge cases with normal OCR output.
     */
    const plainMatches =
      text.match(/(?<!\d)\d{11}(?!\d)/g) ?? [];

    for (const match of plainMatches) {
      candidates.add(match);
    }

    return [...candidates];
  }

  private isNinLabel(text: string): boolean {
    const normalized = text
      .replace(/[^a-zA-Z0-9\s:.-]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();

    return (
      /\bNIN\b/.test(normalized) ||
      /\bNIN\s*(?:NO|NO\.|NUMBER)\b/.test(normalized) ||
      /\bNATIONAL\s+IDENTIFICATION(?:\s+NUMBER)?\b/.test(
        normalized,
      )
    );
  }

  /**
   * Looks for the NIN value on the same OCR line as the label,
   * then on the next few lines.
   *
   * This is important because Textract may return:
   *
   *   NIN
   *   66412345622
   *
   * as two separate LINE blocks.
   */
  private extractLabelledNin(lines: OcrLine[]): string | null {
    for (let i = 0; i < lines.length; i += 1) {
      if (!this.isNinLabel(lines[i].text)) {
        continue;
      }

      /*
       * Priority 1:
       * Candidate on the same line as "NIN".
       */
      const sameLineCandidates =
        this.extractElevenDigitCandidates(
          lines[i].text,
        );

      if (sameLineCandidates.length === 1) {
        return sameLineCandidates[0];
      }

      /*
       * Priority 2:
       * Candidate on the next few OCR lines.
       *
       * We deliberately keep this window small so that a later
       * phone number elsewhere on the NIN slip is not mistaken
       * for the NIN.
       */
      const nearbyCandidates = new Set<string>();

      for (
        let offset = 1;
        offset <= 3 && i + offset < lines.length;
        offset += 1
      ) {
        const candidates =
          this.extractElevenDigitCandidates(
            lines[i + offset].text,
          );

        for (const candidate of candidates) {
          nearbyCandidates.add(candidate);
        }
      }

      if (nearbyCandidates.size === 1) {
        return [...nearbyCandidates][0];
      }

      /*
       * More than one candidate near the NIN label means the OCR
       * is ambiguous. Do not guess.
       */
      if (nearbyCandidates.size > 1) {
        return null;
      }
    }

    return null;
  }

  private extractFallbackCandidates(lines: OcrLine[]): string[] {
    const candidates = new Set<string>();

    for (const line of lines) {
      for (const candidate of this.extractElevenDigitCandidates(
        line.text,
      )) {
        candidates.add(candidate);
      }
    }

    return [...candidates];
  }

  async extractNinNumber(imagePath: string): Promise<string> {
    const imageBytes = await this.downloadImage(imagePath);

    let result;

    try {
      result = await this.client.send(
        new DetectDocumentTextCommand({
          Document: {
            Bytes: imageBytes,
          },
        }),
      );
    } catch {
      throw new InternalServerErrorException(
        "NIN document OCR failed",
      );
    }

    const lines: OcrLine[] =
      result.Blocks
        ?.filter(
          (block) => block.BlockType === "LINE",
        )
        .map((block, index) => ({
          text: block.Text?.trim() ?? "",
          index,
        }))
        .filter((line) => Boolean(line.text)) ?? [];

    if (lines.length === 0) {
      throw new BadRequestException(
        "No readable text was detected on the NIN document.",
      );
    }

    /*
     * Primary strategy:
     * explicitly associate the number with the NIN label.
     */
    const labelledNin = this.extractLabelledNin(lines);

    if (labelledNin) {
      return labelledNin;
    }

    /*
     * Fallback:
     * only use an unlabelled 11-digit candidate when there is
     * exactly one candidate in the entire document.
     *
     * We do NOT choose between multiple 11-digit values because
     * phone numbers are also 11 digits.
     */
    const fallbackCandidates =
      this.extractFallbackCandidates(lines);

    if (fallbackCandidates.length === 1) {
      return fallbackCandidates[0];
    }

    if (fallbackCandidates.length === 0) {
      throw new BadRequestException(
        "NIN could not be detected from the uploaded document. Please upload a clear NIN document.",
      );
    }

    throw new BadRequestException(
      "The NIN could not be identified confidently from the uploaded document. Please upload a clearer NIN document.",
    );
  }
}