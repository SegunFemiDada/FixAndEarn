require("dotenv").config();

const fs = require("fs");
const {
  RekognitionClient,
  SearchFacesByImageCommand,
} = require("@aws-sdk/client-rekognition");

const IMAGE_PATH =
  "C:\\Users\\oluwa\\Downloads\\WhatsApp Image 2026-09-13 at 18.13.24.jpeg";

async function testSearch(client, imageBytes, qualityFilter) {
  console.log(`\nTesting SearchFacesByImage with QualityFilter=${qualityFilter}`);

  try {
    const result = await client.send(
      new SearchFacesByImageCommand({
        CollectionId:
          process.env.AWS_REKOGNITION_COLLECTION_ID,
        Image: {
          Bytes: imageBytes,
        },
        MaxFaces: 1,
        FaceMatchThreshold: 99,
        QualityFilter: qualityFilter,
      }),
    );

    console.log("Search succeeded.");

    console.log(
      "Matches:",
      result.FaceMatches?.length ?? 0,
    );

    if (result.SearchedFaceConfidence != null) {
      console.log(
        "Searched face confidence:",
        result.SearchedFaceConfidence,
      );
    }

    if (result.SearchedFaceBoundingBox) {
      console.log(
        "Searched face bounding box:",
        result.SearchedFaceBoundingBox,
      );
    }

    for (const match of result.FaceMatches ?? []) {
      console.log(
        "Match similarity:",
        match.Similarity,
      );

      console.log(
        "Matched face ID exists:",
        Boolean(match.Face?.FaceId),
      );
    }
  } catch (error) {
    console.log("Search failed.");
    console.log("Error:", error.name);
    console.log("Message:", error.message);
  }
}

async function main() {
  if (!fs.existsSync(IMAGE_PATH)) {
    throw new Error(`Image not found: ${IMAGE_PATH}`);
  }

  const region =
    process.env.AWS_REKOGNITION_REGION;

  const collectionId =
    process.env.AWS_REKOGNITION_COLLECTION_ID;

  if (!region) {
    throw new Error(
      "AWS_REKOGNITION_REGION is missing.",
    );
  }

  if (!collectionId) {
    throw new Error(
      "AWS_REKOGNITION_COLLECTION_ID is missing.",
    );
  }

  console.log(
    "Testing collection:",
    collectionId,
  );

  const client = new RekognitionClient({
    region,
  });

  const imageBytes = fs.readFileSync(IMAGE_PATH);

  await testSearch(
    client,
    imageBytes,
    "AUTO",
  );

  await testSearch(
    client,
    imageBytes,
    "NONE",
  );
}

main().catch((error) => {
  console.error(
    "\nSELFIE SEARCH TEST FAILED:",
  );
  console.error(
    error.name || "UnknownError",
  );
  console.error(
    error.message || error,
  );
  process.exitCode = 1;
});