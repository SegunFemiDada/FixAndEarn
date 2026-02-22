import { IsOptional, IsString, MaxLength } from "class-validator";

export class RequestCompletionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
