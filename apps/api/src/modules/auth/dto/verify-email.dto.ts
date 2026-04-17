//path: apps/api/src/modules/auth/dto/verify-email.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class VerifyEmailDto {
  @ApiProperty()
  @IsString()
  token!: string;
}