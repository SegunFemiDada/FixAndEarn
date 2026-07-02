//path: apps/api/src/admin/dto/admin-2fa-verify.dto.ts
import { IsString, Length } from "class-validator";

export class Admin2faVerifyDto {
  @IsString()
  @Length(6, 8)
  totp!: string;
}