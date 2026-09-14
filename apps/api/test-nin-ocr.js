require("dotenv").config();

const fs = require("fs");
const {
  TextractClient,
  DetectDocumentTextCommand,
} = require("@aws-sdk/client-textract");

const IMAGE_PATH =
  "C:\\Users\\oluwa\\Downloads\\WhatsApp Image 2026-09-14 at 15.07.35.jpeg";

function isNinLabel(text) {
  const normalized = text
    .replace(/[^a-zA-Z0-9\s:.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

  return (
    /\bNIN\b/.test(normalized) ||
    /\bNIN\s*(?:NO|NO\.|NUMBER)\b/.test(normalized) ||
    /\bNATIONAL\s+IDENTIFICATION(?:\s+NUMBER)?\b/.test(
      normalized,
    )
  );
}

function extractElevenDigitCandidates(text) {
  const candidates = new Set();

  const matches =
    text.match(
      /(?<!\d)(?:\d[\s-]*){11}(?!\d)/g,
    ) ?? [];

  for (const match of matches) {
    const digits = match.replace(/\D/g, "");

    if (digits.length === 11) {
      candidates.add(digits);
    }
  }

  const plainMatches =
    text.match(/(?<!\d)\d{11}(?!\d)/g) ?? [];

  for (const match of plainMatches) {
    candidates.add(match);
  }

  return [...candidates];
}

function maskNin(value) {
  return `${value.slice(0, 3)}****${value.slice(-2)}`;
}

function findLabelledNin(lines) {
  for (let i = 0; i < lines.length; i += 1) {
    if (!isNinLabel(lines[i])) {
      continue;
    }

    const sameLineCandidates =
      extractElevenDigitCandidates(lines[i]);

    if (sameLineCandidates.length === 1) {
      return sameLineCandidates[0];
    }

    const nearbyCandidates = new Set();

    for (
      let offset = 1;
      offset <= 3 && i + offset < lines.length;
      offset += 1
    ) {
      for (const candidate of extractElevenDigitCandidates(
        lines[i + offset],
      )) {
        nearbyCandidates.add(candidate);
      }
    }

    if (nearbyCandidates.size === 1) {
      return [...nearbyCandidates][0];
    }

    if (nearbyCandidates.size > 1) {
      return null;
    }
  }

  return null;
}

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
      ?.filter(
        (block) => block.BlockType === "LINE",
      )
      .map((block) => block.Text ?? "")
      .filter(Boolean) ?? [];

  console.log("\nDetected text:");

  for (const line of lines) {
    console.log("-", line);
  }

  const allCandidates = [
    ...new Set(
      lines.flatMap((line) =>
        extractElevenDigitCandidates(line),
      ),
    ),
  ];

  console.log(
    "\nTotal 11-digit candidates:",
    allCandidates.length,
  );

  for (const candidate of allCandidates) {
    console.log("-", maskNin(candidate));
  }

  const selectedNin = findLabelledNin(lines);

  if (selectedNin) {
    console.log(
      "\nSelected NIN:",
      maskNin(selectedNin),
    );

    console.log(
      "\nNIN OCR SELECTION TEST PASSED.",
    );

    return;
  }

  console.log(
    "\nNIN OCR SELECTION TEST FAILED:",
  );

  console.log(
    "No unique NIN-labelled candidate could be identified.",
  );

  process.exitCode = 1;
}

main().catch((error) => {
  console.error("\nNIN OCR TEST FAILED:");
  console.error(error.name || "UnknownError");
  console.error(error.message || error);
  process.exitCode = 1;
});