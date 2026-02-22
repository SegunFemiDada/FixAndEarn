import { IsInt, IsOptional, IsString, Max, Min, MaxLength } from "class-validator";

export class ApproveCompletionDto {
  @IsInt()
  @Min(1)
  @Max(5)
  stars!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
