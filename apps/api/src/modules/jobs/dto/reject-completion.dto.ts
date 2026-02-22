import { IsOptional, IsString, MaxLength } from "class-validator";

export class RejectCompletionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
