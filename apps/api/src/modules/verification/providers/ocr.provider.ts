// Path: /apps/api/src/modules/verification/providers/ocr.provider.ts
export interface OcrProvider {
  extractNinNumber(imagePath: string): Promise<string>;
}
