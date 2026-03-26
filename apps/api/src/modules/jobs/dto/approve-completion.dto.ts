//path: apps/api/src/modules/jobs/dto/approve-completion.dto.ts
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class ApproveCompletionDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
