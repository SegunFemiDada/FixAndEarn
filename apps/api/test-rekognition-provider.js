require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { v2: cloudinary } = require("cloudinary");

const {
  RekognitionClient,
  SearchFacesByImageCommand,
  DeleteFacesCommand,
  IndexFacesCommand,
} = require("@aws-sdk/client-rekognition");

const IMAGE_PATH =
  "C:\\Users\\oluwa\\Downloads\\WhatsApp Image 2026-09-13 at 18.13.24.jpeg";

const REGION = process.env.AWS_REKOGNITION_REGION;
const COLLECTION_ID = process.env.AWS_REKOGNITION_COLLECTION_ID;

const TEST_EXTERNAL_ID = `fixandearn-biometric-provider-test-${Date.now()}`;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadTestImage() {
  const result = await cloudinary.uploader.upload(IMAGE_PATH, {
    folder: "fixandearn/biometric-tests",
    resource_type: "image",
  });

  return {
    secureUrl: result.secure_url,
    publicId: result.public_id,
  };
}

async function deleteCloudinaryImage(publicId) {
  await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });
}

async function main() {
  if (!fs.existsSync(IMAGE_PATH)) {
    throw new Error(`Test image not found: ${IMAGE_PATH}`);
  }

  console.log("Starting FixAndEarn Rekognition provider test...");
  console.log("Collection:", COLLECTION_ID);
  console.log("Region:", REGION);

  let uploaded = null;
  let faceId = null;

  try {
    console.log("\n1. Uploading test selfie to Cloudinary...");

    uploaded = await uploadTestImage();

    console.log("Cloudinary upload successful.");
    console.log("Image URL:", uploaded.secureUrl);

    console.log("\n2. Downloading the Cloudinary image through HTTPS...");

    const imageResponse = await fetch(uploaded.secureUrl);

    if (!imageResponse.ok) {
      throw new Error(
        `Cloudinary image fetch failed: ${imageResponse.status}`,
      );
    }

    const imageBytes = Buffer.from(
      await imageResponse.arrayBuffer(),
    );

    console.log(
      "Downloaded image bytes:",
      imageBytes.length,
    );

    const client = new RekognitionClient({
      region: REGION,
    });

    console.log("\n3. Searching the development collection...");

    const searchBefore = await client.send(
      new SearchFacesByImageCommand({
        CollectionId: COLLECTION_ID,
        Image: {
          Bytes: imageBytes,
        },
        MaxFaces: 5,
        FaceMatchThreshold: Number(
          process.env.FACE_MATCH_DUPLICATE_THRESHOLD || 99,
        ),
        QualityFilter: "AUTO",
      }),
    );

    console.log(
      "Existing matches before indexing:",
      searchBefore.FaceMatches?.length ?? 0,
    );

    console.log("\n4. Indexing the face...");

    const indexed = await client.send(
      new IndexFacesCommand({
        CollectionId: COLLECTION_ID,
        Image: {
          Bytes: imageBytes,
        },
        ExternalImageId: TEST_EXTERNAL_ID,
        MaxFaces: 1,
        QualityFilter: "AUTO",
        DetectionAttributes: [],
      }),
    );

    const record = indexed.FaceRecords?.[0];

    if (!record?.Face?.FaceId) {
      throw new Error("Rekognition did not index a usable face.");
    }

    faceId = record.Face.FaceId;

    console.log("Face indexed successfully:");
    console.log({
      faceId,
      externalImageId: record.Face.ExternalImageId,
      confidence: record.Face.Confidence,
    });

    console.log("\n5. Searching again for the same person...");

    const searchAfter = await client.send(
      new SearchFacesByImageCommand({
        CollectionId: COLLECTION_ID,
        Image: {
          Bytes: imageBytes,
        },
        MaxFaces: 5,
        FaceMatchThreshold: Number(
          process.env.FACE_MATCH_DUPLICATE_THRESHOLD || 99,
        ),
        QualityFilter: "AUTO",
      }),
    );

    console.log(
      "Matches after indexing:",
      searchAfter.FaceMatches?.length ?? 0,
    );

    for (const match of searchAfter.FaceMatches ?? []) {
      console.log({
        faceId: match.Face?.FaceId,
        externalImageId: match.Face?.ExternalImageId,
        similarity: match.Similarity,
      });
    }

    const selfMatch = searchAfter.FaceMatches?.find(
      (match) => match.Face?.FaceId === faceId,
    );

    if (!selfMatch) {
      throw new Error(
        "CRITICAL: indexed face could not be found by SearchFacesByImage.",
      );
    }

    console.log(
      "\nSELF-MATCH CONFIRMED. Similarity:",
      selfMatch.Similarity,
    );

    console.log("\n6. Cleaning up Rekognition test face...");

    await client.send(
      new DeleteFacesCommand({
        CollectionId: COLLECTION_ID,
        FaceIds: [faceId],
      }),
    );

    faceId = null;

    console.log("Rekognition face deleted.");

    console.log("\n7. Cleaning up Cloudinary test image...");

    await deleteCloudinaryImage(uploaded.publicId);
    uploaded = null;

    console.log("Cloudinary image deleted.");

    console.log(
      "\nFIXANDEARN REKOGNITION PROVIDER TEST PASSED.",
    );
  } catch (error) {
    console.error("\nTEST FAILED:");
    console.error(error.name || "UnknownError");
    console.error(error.message || error);

    if (faceId) {
      try {
        const client = new RekognitionClient({
          region: REGION,
        });

        await client.send(
          new DeleteFacesCommand({
            CollectionId: COLLECTION_ID,
            FaceIds: [faceId],
          }),
        );

        console.log("Emergency Rekognition cleanup completed.");
      } catch (cleanupError) {
        console.error(
          "WARNING: Rekognition cleanup failed:",
          cleanupError.message,
        );
      }
    }

    if (uploaded?.publicId) {
      try {
        await deleteCloudinaryImage(uploaded.publicId);
        console.log("Emergency Cloudinary cleanup completed.");
      } catch (cleanupError) {
        console.error(
          "WARNING: Cloudinary cleanup failed:",
          cleanupError.message,
        );
      }
    }

    process.exitCode = 1;
  }
}

main();