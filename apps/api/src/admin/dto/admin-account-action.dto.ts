//path: apps/api/src/admin/dto/admin-account-action.dto.ts
import { IsOptional, IsString, MaxLength } from "class-validator";

export class AdminAccountActionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}