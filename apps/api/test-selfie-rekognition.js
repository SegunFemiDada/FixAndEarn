require("dotenv").config();

const fs = require("fs");
const {
  RekognitionClient,
  DetectFacesCommand,
} = require("@aws-sdk/client-rekognition");

const IMAGE_PATH =
  "C:\\Users\\oluwa\\Downloads\\WhatsApp Image 2026-09-13 at 18.13.24.jpeg";

async function main() {
  if (!fs.existsSync(IMAGE_PATH)) {
    throw new Error(`Image not found: ${IMAGE_PATH}`);
  }

  const region = process.env.AWS_REKOGNITION_REGION;

  if (!region) {
    throw new Error(
      "AWS_REKOGNITION_REGION is missing.",
    );
  }

  const client = new RekognitionClient({
    region,
  });

  const imageBytes = fs.readFileSync(IMAGE_PATH);

  const result = await client.send(
    new DetectFacesCommand({
      Image: {
        Bytes: imageBytes,
      },
      Attributes: ["DEFAULT"],
    }),
  );

  const faces = result.FaceDetails ?? [];

  console.log(
    "\nDetected faces:",
    faces.length,
  );

  if (faces.length === 0) {
    console.log(
      "\nSELFIE FACE DETECTION FAILED.",
    );

    console.log(
      "Rekognition could not detect a face in the supplied image.",
    );

    process.exitCode = 1;
    return;
  }

  console.log(
    "\nSELFIE FACE DETECTION PASSED.",
  );

  for (let i = 0; i < faces.length; i += 1) {
    const face = faces[i];

    console.log(
      `Face ${i + 1}:`,
      face.BoundingBox
        ? {
            width: face.BoundingBox.Width,
            height: face.BoundingBox.Height,
          }
        : "bounding box unavailable",
    );
  }
}

main().catch((error) => {
  console.error(
    "\nSELFIE REKOGNITION TEST FAILED:",
  );

  console.error(
    error.name || "UnknownError",
  );

  console.error(
    error.message || error,
  );

  process.exitCode = 1;
});