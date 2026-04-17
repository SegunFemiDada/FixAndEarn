import { IsString, MinLength } from "class-validator";

export class VerifyWithdrawalPinDto {
  @IsString()
  @MinLength(4)
  pin!: string;
}