import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import {
  JobPaymentStatus,
  JobPaymentType,
} from "@prisma/client";

export class AdminPaymentSearchDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEnum(JobPaymentStatus)
  status?: JobPaymentStatus;

  @IsOptional()
  @IsEnum(JobPaymentType)
  type?: JobPaymentType;

  @IsOptional()
  @IsString()
  jobId?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  fixerId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;
}