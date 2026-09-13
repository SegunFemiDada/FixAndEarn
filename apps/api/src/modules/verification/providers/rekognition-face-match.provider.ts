import {
  DeleteFacesCommand,
  IndexFacesCommand,
  RekognitionClient,
  SearchFacesByImageCommand,
} from "@aws-sdk/client-rekognition";
import { Injectable, InternalServerErrorException } from "@nestjs/common";

import {
  FaceMatchProvider,
  FaceMatchResult,
  IndexedFaceResult,
} from "./face-match.provider";

@Injectable()
export class RekognitionFaceMatchProvider implements FaceMatchProvider {
  private readonly client: RekognitionClient;
  private readonly collectionId: string;
  private readonly threshold: number;

  constructor() {
    const region = process.env.AWS_REKOGNITION_REGION;
    const collectionId = process.env.AWS_REKOGNITION_COLLECTION_ID;

    if (!region) {
      throw new Error("AWS_REKOGNITION_REGION is not configured");
    }

    if (!collectionId) {
      throw new Error("AWS_REKOGNITION_COLLECTION_ID is not configured");
    }

    this.client = new RekognitionClient({
      region,
    });

    this.collectionId = collectionId;

    const parsedThreshold = Number(
      process.env.FACE_MATCH_DUPLICATE_THRESHOLD ?? "99",
    );

    this.threshold = Number.isFinite(parsedThreshold)
      ? parsedThreshold
      : 99;
  }

  private async downloadImage(selfiePath: string): Promise<Buffer> {
    let url: URL;

    try {
      url = new URL(selfiePath);
    } catch {
      throw new InternalServerErrorException(
        "Invalid selfie image URL",
      );
    }

    if (url.protocol !== "https:") {
      throw new InternalServerErrorException(
        "Selfie image must use HTTPS",
      );
    }

    if (!url.hostname.endsWith(".cloudinary.com")) {
      throw new InternalServerErrorException(
        "Selfie image provider is not allowed",
      );
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new InternalServerErrorException(
        "Unable to retrieve selfie image",
      );
    }

    const arrayBuffer = await response.arrayBuffer();

    return Buffer.from(arrayBuffer);
  }

  async searchExistingFace(
    selfiePath: string,
  ): Promise<FaceMatchResult | null> {
    const imageBytes = await this.downloadImage(selfiePath);

    const result = await this.client.send(
      new SearchFacesByImageCommand({
        CollectionId: this.collectionId,
        Image: {
          Bytes: imageBytes,
        },
        MaxFaces: 1,
        FaceMatchThreshold: this.threshold,
        QualityFilter: "AUTO",
      }),
    );

    const match = result.FaceMatches?.[0];

    if (!match?.Face?.FaceId || match.Similarity == null) {
      return null;
    }

    return {
      faceId: match.Face.FaceId,
      externalImageId: match.Face.ExternalImageId ?? null,
      similarity: match.Similarity,
    };
  }

  async indexApprovedFace(
    selfiePath: string,
    userId: string,
  ): Promise<IndexedFaceResult> {
    const imageBytes = await this.downloadImage(selfiePath);

    const result = await this.client.send(
      new IndexFacesCommand({
        CollectionId: this.collectionId,
        Image: {
          Bytes: imageBytes,
        },
        ExternalImageId: userId,
        MaxFaces: 1,
        QualityFilter: "AUTO",
        DetectionAttributes: [],
      }),
    );

    const record = result.FaceRecords?.[0];

    if (!record?.Face?.FaceId) {
      const reason =
        result.UnindexedFaces?.[0]?.Reasons?.join(", ") ??
        "NO_USABLE_FACE";

      throw new InternalServerErrorException(
        `Selfie could not be indexed: ${reason}`,
      );
    }

    return {
      faceId: record.Face.FaceId,
      externalImageId: userId,
    };
  }

  async deleteFace(faceId: string): Promise<void> {
    await this.client.send(
      new DeleteFacesCommand({
        CollectionId: this.collectionId,
        FaceIds: [faceId],
      }),
    );
  }
}