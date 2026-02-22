// Path: /apps/api/src/modules/jobs/dto/create-job.dto.ts
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  skillCategory!: string;

  @IsString()
  @IsNotEmpty()
  state!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsOptional()
  @IsString()
  lga?: string;

  @IsOptional()
  @IsString()
  area?: string;

  // milliFEC integer
  @IsInt()
  @Min(1)
  priceMilliFec!: number;
}
