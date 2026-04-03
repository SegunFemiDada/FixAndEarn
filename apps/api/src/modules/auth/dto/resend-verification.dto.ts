//path: apps/api/src/modules/auth/dto/forgot-password.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class ResendVerificationDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email!: string;
}