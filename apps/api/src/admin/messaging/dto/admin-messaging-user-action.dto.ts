import { IsOptional, IsString, MaxLength } from "class-validator";

export class AdminMessagingUserActionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}