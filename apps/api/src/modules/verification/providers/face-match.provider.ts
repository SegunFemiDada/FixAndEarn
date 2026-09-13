export type FaceMatchResult = {
  faceId: string;
  externalImageId: string | null;
  similarity: number;
};

export type IndexedFaceResult = {
  faceId: string;
  externalImageId: string;
  similarity?: number;
};

export interface FaceMatchProvider {
  searchExistingFace(
    selfiePath: string,
  ): Promise<FaceMatchResult | null>;

  indexApprovedFace(
    selfiePath: string,
    userId: string,
  ): Promise<IndexedFaceResult>;

  deleteFace(faceId: string): Promise<void>;
}