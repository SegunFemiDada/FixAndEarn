import { IsInt, Min, Max, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateRatingDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  review?: string;
}