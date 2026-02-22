// Path: /apps/api/src/modules/verification/providers/face-match.provider.ts
export interface FaceMatchProvider {
  generateFaceHash(selfiePath: string): Promise<string>;
}
