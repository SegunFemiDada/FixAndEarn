import { IsString, MinLength } from "class-validator";

export class AdminLogoutDto {
  @IsString()
  @MinLength(20)
  refreshToken!: string;
}