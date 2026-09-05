// Path: apps/api/src/modules/verification/verification.controller.ts

import {
  BadRequestException,
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
import { StorageProvider } from "../../common/storage/storage.provider";
import { SubmitVerificationDto } from "./dto/submit-verification.dto";
import { VerificationService } from "./verification.service";

const MAX_VERIFICATION_FILE_SIZE = 2 * 1024 * 1024;

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const UTILITY_BILL_MIME_TYPES = new Set([
  ...IMAGE_MIME_TYPES,
  "application/pdf",
]);

function validateVerificationFile(
  file: Express.Multer.File,
  fieldName: "ninImage" | "selfie" | "utilityBill",
): void {
  if (file.size > MAX_VERIFICATION_FILE_SIZE) {
    throw new BadRequestException(
      `${fieldName.toUpperCase()}_FILE_TOO_LARGE`,
    );
  }

  const allowedTypes =
    fieldName === "utilityBill"
      ? UTILITY_BILL_MIME_TYPES
      : IMAGE_MIME_TYPES;

  if (!allowedTypes.has(file.mimetype)) {
    throw new BadRequestException(
      `${fieldName.toUpperCase()}_INVALID_FILE_TYPE`,
    );
  }

  if (fieldName !== "utilityBill" && file.mimetype === "application/pdf") {
    throw new BadRequestException(
      `${fieldName.toUpperCase()}_INVALID_FILE_TYPE`,
    );
  }
}

@ApiTags("verification")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("verification")
export class VerificationController {
  constructor(
    private readonly storage: StorageProvider,
    private readonly verification: VerificationService,
  ) {}

  @Get("me")
  async getMyVerification(@CurrentUser() user: { userId: string }) {
    return this.verification.getMine(user.userId);
  }

  @Post("submit")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: "ninImage", maxCount: 1 },
        { name: "selfie", maxCount: 1 },
        { name: "utilityBill", maxCount: 1 },
      ],
      {
        limits: {
          fileSize: MAX_VERIFICATION_FILE_SIZE,
          files: 3,
        },
      },
    ),
  )
  async submit(
    @CurrentUser() user: { userId: string },
    @Body() dto: SubmitVerificationDto,
    @UploadedFiles()
    files: {
      ninImage?: Express.Multer.File[];
      selfie?: Express.Multer.File[];
      utilityBill?: Express.Multer.File[];
    },
  ) {
    const ninImage = files.ninImage?.[0];
    const selfie = files.selfie?.[0];
    const utilityBill = files.utilityBill?.[0];

    if (ninImage) {
      validateVerificationFile(ninImage, "ninImage");
    }

    if (selfie) {
      validateVerificationFile(selfie, "selfie");
    }

    if (utilityBill) {
      validateVerificationFile(utilityBill, "utilityBill");
    }

    const ninImagePath = ninImage
      ? await this.storage.save(ninImage, "nin")
      : undefined;

    const selfiePath = selfie
      ? await this.storage.save(selfie, "selfie")
      : undefined;

    const utilityBillPath = utilityBill
      ? await this.storage.save(utilityBill, "utility")
      : undefined;

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