import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, Matches } from "class-validator";

export class SaveBankDetailsDto {
  @ApiProperty() @IsString() bankName!: string;
  @ApiProperty() @IsString() accountName!: string;

  @ApiProperty({ description: "Nigerian account number" })
  @IsString()
  @Length(10, 10)
  @Matches(/^\d+$/, { message: "Digits only" })
  accountNumber!: string;

  @ApiProperty({ description: "BVN (will be encrypted, not stored raw)" })
  @IsString()
  @Length(11, 11)
  @Matches(/^\d+$/, { message: "Digits only" })
  bvn!: string;

  @ApiProperty({ description: "Paystack bank code (e.g. 058)" })
  @IsString()
  @Matches(/^\d+$/, { message: "Digits only" })
  bankCode!: string;
}