// Path: /apps/api/src/modules/verification/dto/submit-verification.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString, MinLength, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class AddressDto {
  @ApiProperty() @IsString() house!: string;
  @ApiProperty() @IsString() street!: string;
  @ApiProperty() @IsString() area!: string;
  @ApiProperty() @IsString() busStop!: string;
  @ApiProperty() @IsString() lga!: string;
  @ApiProperty() @IsString() city!: string;
  @ApiProperty() @IsString() state!: string;
}

export class SubmitVerificationDto {
  @ApiProperty({ description: "BVN (will be hashed, not stored raw)" })
  @IsString()
  @MinLength(6)
  bvn!: string;

  @ApiProperty()
  @IsString()
  bio!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  skills!: string[];

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  instagram?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  tiktok?: string;
}
