import { IsOptional, IsString, MaxLength } from "class-validator";

export class AdminAccountActionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}