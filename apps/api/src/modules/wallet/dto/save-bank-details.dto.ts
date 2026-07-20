//path: apps/api/src/modules/wallet/dto/save-bank-details.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength, MaxLength, IsOptional } from "class-validator";

export class SaveBankDetailsDto {
  @ApiProperty()
  @IsString()
  bankName!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bankCode?: string;

  @ApiProperty()
  @IsString()
  accountName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(10)
  accountNumber!: string;

  @ApiProperty()
  @IsString()
  @MinLength(11)
  @MaxLength(11)
  bvn!: string;
}