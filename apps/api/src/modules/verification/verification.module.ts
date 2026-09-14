// Path: /apps/api/src/modules/verification/verification.module.ts

import { Module } from "@nestjs/common";

import { StorageModule } from "../../common/storage/storage.module";
import { VerificationController } from "./verification.controller";
import { VerificationService } from "./verification.service";

import {
  OCR_PROVIDER,
  FACE_MATCH_PROVIDER,
} from "./providers/providers.tokens";

import { TextractOcrProvider } from "./providers/textract-ocr.provider";
import { RekognitionFaceMatchProvider } from "./providers/rekognition-face-match.provider";

@Module({
  imports: [StorageModule],

  controllers: [VerificationController],

  providers: [
    VerificationService,

    {
      provide: OCR_PROVIDER,
      useClass: TextractOcrProvider,
    },

    {
      provide: FACE_MATCH_PROVIDER,
      useClass: RekognitionFaceMatchProvider,
    },

    TextractOcrProvider,
    RekognitionFaceMatchProvider,
  ],

  exports: [
    FACE_MATCH_PROVIDER,
  ],
})
export class VerificationModule {}