// Path: apps/api/src/modules/disputes/disputes.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { StorageProvider } from "../../common/storage/storage.provider";
import { OpenDisputeDto } from "./dto/open-dispute.dto";
import { DisputesService } from "./disputes.service";

@ApiTags("disputes")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("jobs/:jobId/disputes")
export class DisputesController {
  constructor(
    private readonly disputes: DisputesService,
    private readonly storage: StorageProvider
  ) {}

  @Post()
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("image"))
  async open(
    @Param("jobId") jobId: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: OpenDisputeDto,
    @UploadedFile() image?: Express.Multer.File
  ) {
    let parsedEvidence: unknown = undefined;

    if (dto.evidence) {
      try {
        parsedEvidence = JSON.parse(dto.evidence);
      } catch {
        parsedEvidence = dto.evidence;
      }
    }

    let imagePath: string | undefined;

    if (image) {
      imagePath = await this.storage.save(image, "disputes");
    }

    const evidence =
      imagePath || parsedEvidence !== undefined
        ? {
            ...(parsedEvidence && typeof parsedEvidence === "object" && !Array.isArray(parsedEvidence)
              ? (parsedEvidence as Record<string, unknown>)
              : parsedEvidence !== undefined
                ? { note: parsedEvidence }
                : {}),
            imagePath: imagePath ?? null,
          }
        : undefined;

    return this.disputes.openDispute({
      jobId,
      actorUserId: user.userId,
      reason: dto.reason,
      evidence,
    });
  }

  @Get()
  async get(@Param("jobId") jobId: string, @CurrentUser() user: { userId: string }) {
    return this.disputes.getDispute(jobId, user.userId);
  }
}