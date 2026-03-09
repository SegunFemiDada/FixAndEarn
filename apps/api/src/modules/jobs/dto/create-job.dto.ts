import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";

export class CreateJobDto {
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

  @Type(() => Number)
  @IsInt()
  @Min(1)
  priceMilliFec!: number;
}