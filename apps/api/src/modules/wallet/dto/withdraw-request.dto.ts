// Path: /apps/api/src/modules/wallet/dto/withdraw-request.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsInt, Min } from "class-validator";

export class WithdrawRequestDto {
  @ApiProperty({ description: "Amount in milliFEC. Must be <= available balance." })
  @IsInt()
  @Min(1)
  amountMilliFec!: number;
}
