import { IsString, Length } from "class-validator";

export class Admin2faVerifyDto {
  @IsString()
  @Length(6, 8)
  totp!: string;
}