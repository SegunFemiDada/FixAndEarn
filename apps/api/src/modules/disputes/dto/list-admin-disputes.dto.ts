import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { DisputeStatus } from "@prisma/client";

export class ListAdminDisputesDto {
  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  jobId?: string;
}