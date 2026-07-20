//path: apps/api/src/modules/wallet/dto/set-withdrawal-pin.dto.ts
import { IsString, MinLength, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SetWithdrawalPinDto {
  @ApiProperty({ description: "Current pin (required when changing existing pin)", required: false })
  @IsOptional()
  @IsString()
  currentPin?: string;

  @ApiProperty({ description: "New pin (4-6 digits)" })
  @IsString()
  @MinLength(4)
  newPin!: string;
}