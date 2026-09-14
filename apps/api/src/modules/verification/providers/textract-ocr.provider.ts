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

    const arrayBuffer = await response.arrayBuffer();

    return Buffer.from(arrayBuffer);
  }

  private normalizeNinCandidate(value: string): string | null {
    const digits = value.replace(/\D/g, "");

    return digits.length === 11 ? digits : null;
  }

  private extractCandidates(lines: string[]): string[] {
    const candidates = new Set<string>();

    const addCandidate = (value: string) => {
      const normalized = this.normalizeNinCandidate(value);

      if (normalized) {
        candidates.add(normalized);
      }
    };

    /*
     * Prefer candidates explicitly associated with NIN wording.
     * This helps avoid accidentally treating a phone number,
     * account number, date, etc. as the NIN.
     */
    for (const line of lines) {
      if (
        /NIN|NATIONAL\s+IDENTIFICATION(?:\s+NUMBER)?/i.test(
          line,
        )
      ) {
        const matches = line.match(
          /(?:\d[\s-]*){11}/g,
        ) ?? [];

        for (const match of matches) {
          addCandidate(match);
        }

        const compact = line.replace(/[^\d]/g, "");

        if (compact.length === 11) {
          addCandidate(compact);
        }
      }
    }

    /*
     * Fallback: inspect the complete OCR text for an exact
     * 11-digit candidate.
     *
     * We only accept a single unique candidate. Multiple
     * candidates are deliberately rejected rather than guessed.
     */
    if (candidates.size === 0) {
      const fullText = lines.join(" ");

      const matches =
        fullText.match(
          /(?<!\d)(?:\d[\s-]*){11}(?!\d)/g,
        ) ?? [];

      for (const match of matches) {
        addCandidate(match);
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

    const lines =
      result.Blocks
        ?.filter(
          (block) => block.BlockType === "LINE",
        )
        .map((block) => block.Text?.trim() ?? "")
        .filter(Boolean) ?? [];

    const candidates = this.extractCandidates(lines);

    if (candidates.length === 0) {
      throw new BadRequestException(
        "NIN could not be detected from the uploaded document. Please upload a clear NIN document.",
      );
    }

    if (candidates.length > 1) {
      throw new BadRequestException(
        "Multiple possible NIN numbers were detected. Please upload a clearer NIN document.",
      );
    }

    return candidates[0];
  }
}