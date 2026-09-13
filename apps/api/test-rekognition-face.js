require('dotenv').config();

const fs = require('fs');
const {
  RekognitionClient,
  IndexFacesCommand,
  SearchFacesByImageCommand,
  DeleteFacesCommand,
  ListFacesCommand,
} = require('@aws-sdk/client-rekognition');

const IMAGE_PATH =
  'C:\\Users\\oluwa\\Downloads\\WhatsApp Image 2026-09-13 at 18.13.24.jpeg';

const REGION = process.env.AWS_REKOGNITION_REGION;
const COLLECTION_ID = process.env.AWS_REKOGNITION_COLLECTION_ID;

async function main() {
  if (!fs.existsSync(IMAGE_PATH)) {
    throw new Error(`Test image not found: ${IMAGE_PATH}`);
  }

  console.log('Image found:', IMAGE_PATH);
  console.log('Region:', REGION);
  console.log('Collection:', COLLECTION_ID);

  const client = new RekognitionClient({
    region: REGION,
  });

  const imageBytes = fs.readFileSync(IMAGE_PATH);

  console.log('\n1. Indexing test face...');

  const indexResult = await client.send(
    new IndexFacesCommand({
      CollectionId: COLLECTION_ID,
      Image: {
        Bytes: imageBytes,
      },
      ExternalImageId: 'fixandearn-biometric-test-001',
      DetectionAttributes: [],
      MaxFaces: 1,
      QualityFilter: 'AUTO',
    }),
  );

  console.log(
    'Indexed faces:',
    indexResult.FaceRecords?.length ?? 0,
  );

  if (!indexResult.FaceRecords?.length) {
    console.log('No face was detected in the image.');
    return;
  }

  const indexedFace = indexResult.FaceRecords[0].Face;

  console.log('\nIndexed face details:');
  console.log({
    FaceId: indexedFace.FaceId,
    ExternalImageId: indexedFace.ExternalImageId,
    Confidence: indexedFace.Confidence,
    ImageId: indexedFace.ImageId,
  });

  console.log('\n2. Searching for the same face...');

  const searchResult = await client.send(
    new SearchFacesByImageCommand({
      CollectionId: COLLECTION_ID,
      Image: {
        Bytes: imageBytes,
      },
      MaxFaces: 10,
      FaceMatchThreshold: Number(
        process.env.FACE_MATCH_DUPLICATE_THRESHOLD || 99,
      ),
      QualityFilter: 'AUTO',
    }),
  );

  console.log(
    'Matches found:',
    searchResult.FaceMatches?.length ?? 0,
  );

  for (const match of searchResult.FaceMatches ?? []) {
    console.log({
      FaceId: match.Face?.FaceId,
      ExternalImageId: match.Face?.ExternalImageId,
      Similarity: match.Similarity,
    });
  }

  console.log('\n3. Listing collection faces...');

  const listResult = await client.send(
    new ListFacesCommand({
      CollectionId: COLLECTION_ID,
    }),
  );

  console.log(
    'Faces currently in development collection:',
    listResult.Faces?.length ?? 0,
  );

  console.log('\n4. Cleaning up test face...');

  if (indexedFace.FaceId) {
    await client.send(
      new DeleteFacesCommand({
        CollectionId: COLLECTION_ID,
        FaceIds: [indexedFace.FaceId],
      }),
    );

    console.log('Test face deleted.');
  }

  console.log('\nBIOMETRIC TEST COMPLETED SUCCESSFULLY.');
}

main().catch((error) => {
  console.error('\nBIOMETRIC TEST FAILED:');
  console.error(error.name + ': ' + error.message);
  process.exitCode = 1;
});