// Path: /apps/api/src/modules/verification/providers/stub-ocr.provider.ts
import { Injectable } from "@nestjs/common";
import { OcrProvider } from "./ocr.provider";
import { createHash } from "crypto";

@Injectable()
export class StubOcrProvider implements OcrProvider {
  async extractNinNumber(imagePath: string): Promise<string> {
    // Deterministic: same input path => same NIN
    const hash = createHash("sha256").update(imagePath).digest("hex").slice(0, 10);
    return `NIN-${hash}`;
  }
}
