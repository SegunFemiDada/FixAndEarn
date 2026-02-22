// Path: /apps/api/src/modules/wallet/dto/initiate-deposit.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsInt, Min } from "class-validator";

export class InitiateDepositDto {
  @ApiProperty({ description: "Amount in milliFEC. 1000 = 1.0 FEC = ₦1000" })
  @IsInt()
  @Min(1000)
  amountMilliFec!: number;
}
