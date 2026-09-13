ALTER TABLE "identity_verifications"
ADD COLUMN "rekognitionFaceId" TEXT;

CREATE UNIQUE INDEX "identity_verifications_rekognitionFaceId_key"
ON "identity_verifications"("rekognitionFaceId");
