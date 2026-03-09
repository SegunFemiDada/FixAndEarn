// Path: apps/api/src/modules/verification/verification.controller.ts
import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { LocalStorageProvider } from "../../common/storage/local-storage.provider";
import { SubmitVerificationDto } from "./dto/submit-verification.dto";
import { VerificationService } from "./verification.service";

@ApiTags("verification")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("verification")
export class VerificationController {
  constructor(
    private readonly storage: LocalStorageProvider,
    private readonly verification: VerificationService
  ) {}

  /**
   * GET /verification/me
   * Returns the current user's verification status
   */
  @Get("me")
async getMyVerification(
  @CurrentUser() user: { userId: string }
) {
  const record = await this.verification.getMine(user.userId);

  if (!record) {
    return null;
  }

  return {
    status: record.status,
    reviewReason: record.reviewReason ?? null,
    forceReverify: false,
  };
}

  /**
   * POST /verification/submit
   */
  @Post("submit")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: "ninImage", maxCount: 1 },
      { name: "selfie", maxCount: 1 },
      { name: "utilityBill", maxCount: 1 },
    ])
  )
  async submit(
    @CurrentUser() user: { userId: string },
    @Body() dto: SubmitVerificationDto,
    @UploadedFiles()
    files: {
      ninImage?: Express.Multer.File[];
      selfie?: Express.Multer.File[];
      utilityBill?: Express.Multer.File[];
    }
  ) {
    const ninImage = files.ninImage?.[0];
    const selfie = files.selfie?.[0];
    const utilityBill = files.utilityBill?.[0];

    if (!ninImage || !selfie || !utilityBill) {
      return {
        error: "ninImage, selfie, and utilityBill are required.",
      };
    }

    const ninImagePath = await this.storage.save(ninImage, "nin");
    const selfiePath = await this.storage.save(selfie, "selfie");
    const utilityBillPath = await this.storage.save(utilityBill, "utility");

    const record = await this.verification.submit(user.userId, {
      ...dto,
      ninImagePath,
      selfiePath,
      utilityBillPath,
    });

    return {
      id: record.id,
      status: record.status,
    };
  }
}
