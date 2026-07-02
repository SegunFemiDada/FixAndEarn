//path: apps/api/src/admin/dto/admin-2fa-rotate.dto.ts
import { IsOptional, IsString, MaxLength } from "class-validator";

export class Admin2faRotateDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}