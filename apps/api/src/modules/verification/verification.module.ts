// Path: /apps/api/src/modules/verification/verification.module.ts
import { Module } from "@nestjs/common";
import { StorageModule } from "../../common/storage/storage.module";
import { VerificationController } from "./verification.controller";
import { VerificationService } from "./verification.service";
import { OCR_PROVIDER, FACE_MATCH_PROVIDER } from "./providers/providers.tokens";
import { StubOcrProvider } from "./providers/stub-ocr.provider";
import { StubFaceMatchProvider } from "./providers/stub-face-match.provider";

@Module({
  imports: [StorageModule],
  controllers: [VerificationController],
  providers: [
    VerificationService,
    { provide: OCR_PROVIDER, useClass: StubOcrProvider },
    { provide: FACE_MATCH_PROVIDER, useClass: StubFaceMatchProvider },
    StubOcrProvider,
    StubFaceMatchProvider
  ]
})
export class VerificationModule {}
