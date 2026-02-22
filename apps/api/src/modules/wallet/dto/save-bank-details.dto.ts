// Path: /apps/api/src/modules/wallet/dto/save-bank-details.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class SaveBankDetailsDto {
  @ApiProperty() @IsString() bankName!: string;
  @ApiProperty() @IsString() accountName!: string;

  @ApiProperty({ description: "Nigerian account number" })
  @IsString()
  @Length(10, 10)
  accountNumber!: string;

  @ApiProperty({ description: "BVN (will be encrypted, not stored raw)" })
  @IsString()
  @Length(11, 11)
  bvn!: string;
}
