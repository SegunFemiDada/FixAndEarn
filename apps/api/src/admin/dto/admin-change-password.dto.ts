import { IsString, Length, MinLength } from "class-validator";

export class AdminChangePasswordDto {
  @IsString()
  @MinLength(10)
  currentPassword!: string;

  @IsString()
  @MinLength(10)
  newPassword!: string;

  @IsString()
  @Length(6, 8)
  totp!: string;
}