// Path: /apps/api/src/modules/jobs/dto/update-job.dto.ts
import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class UpdateJobDto {
  @IsOptional()
  @IsString()
  skillCategory?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  lga?: string;

  @IsOptional()
  @IsString()
  area?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  priceMilliFec?: number;
}
