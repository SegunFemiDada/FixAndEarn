import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { JobPostingType, JobStatus } from "@prisma/client";
import { Type } from "class-transformer";

export class AdminJobSearchDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @IsOptional()
  @IsEnum(JobPostingType)
  postingType?: JobPostingType;

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