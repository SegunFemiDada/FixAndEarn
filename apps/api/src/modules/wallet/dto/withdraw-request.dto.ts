import { ApiProperty } from "@nestjs/swagger";
import { IsInt, Min, IsString, MinLength } from "class-validator";

export class WithdrawRequestDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  amountMilliFec!: number;

  @ApiProperty({ description: "Withdrawal pin (4-6 digits)" })
  @IsString()
  @MinLength(4)
  pin!: string;
}