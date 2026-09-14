require("dotenv").config();

const fs = require("fs");
const {
  TextractClient,
  DetectDocumentTextCommand,
} = require("@aws-sdk/client-textract");

const IMAGE_PATH =
  "C:\\Users\\oluwa\\Downloads\\WhatsApp Image 2026-09-14 at 15.07.35.jpeg";

async function main() {
  if (!fs.existsSync(IMAGE_PATH)) {
    throw new Error(`Image not found: ${IMAGE_PATH}`);
  }

  const region = process.env.AWS_REKOGNITION_REGION;

  if (!region) {
    throw new Error(
      "AWS_REKOGNITION_REGION is missing. Check the .env file.",
    );
  }

  const client = new TextractClient({
    region,
  });

  const imageBytes = fs.readFileSync(IMAGE_PATH);

  const result = await client.send(
    new DetectDocumentTextCommand({
      Document: {
        Bytes: imageBytes,
      },
    }),
  );

  const lines =
    result.Blocks
      ?.filter((block) => block.BlockType === "LINE")
      .map((block) => block.Text ?? "")
      .filter(Boolean) ?? [];

  console.log("\nDetected text:");

  for (const line of lines) {
    console.log("-", line);
  }

  const fullText = lines.join(" ");

  const candidates = [
    ...new Set(fullText.match(/\b\d{11}\b/g) ?? []),
  ];

  console.log(
    "\n11-digit NIN candidates:",
    candidates.length,
  );

  for (const candidate of candidates) {
    console.log(
      `${candidate.slice(0, 3)}****${candidate.slice(-2)}`,
    );
  }

  if (candidates.length === 1) {
    console.log("\nNIN OCR TEST PASSED.");
  } else if (candidates.length === 0) {
    console.log(
      "\nNIN OCR TEST: No NIN candidate detected.",
    );
  } else {
    console.log(
      "\nNIN OCR TEST: Multiple candidates detected.",
    );
  }
}

main().catch((error) => {
  console.error("\nNIN OCR TEST FAILED:");
  console.error(error.name || "UnknownError");
  console.error(error.message || error);
  process.exitCode = 1;
});