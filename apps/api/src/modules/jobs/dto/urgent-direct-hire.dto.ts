// Path: apps/api/src/modules/jobs/dto/urgent-direct-hire.dto.ts
import { IsOptional, IsString, MinLength } from "class-validator";

export class UrgentDirectHireDto {
  @IsString()
  @MinLength(1)
  fixerId!: string;

  @IsString()
  @MinLength(2)
  skillCategory!: string;

  @IsString()
  @MinLength(2)
  state!: string;

  @IsString()
  @MinLength(2)
  city!: string;

  @IsOptional()
  @IsString()
  lga?: string;

  @IsOptional()
  @IsString()
  area?: string;
}