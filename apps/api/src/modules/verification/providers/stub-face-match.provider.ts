import { Injectable } from "@nestjs/common";

import {
  FaceMatchProvider,
  FaceMatchResult,
  IndexedFaceResult,
} from "./face-match.provider";

@Injectable()
export class StubFaceMatchProvider implements FaceMatchProvider {
  async searchExistingFace(
    _selfiePath: string,
  ): Promise<FaceMatchResult | null> {
    return null;
  }

  async indexApprovedFace(
    _selfiePath: string,
    userId: string,
  ): Promise<IndexedFaceResult> {
    return {
      faceId: `stub-face-${userId}`,
      externalImageId: userId,
    };
  }

  async deleteFace(_faceId: string): Promise<void> {
    return;
  }
}