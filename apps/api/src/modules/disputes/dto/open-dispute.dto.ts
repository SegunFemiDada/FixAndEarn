import { IsOptional, IsString, MaxLength } from "class-validator";

export class OpenDisputeDto {
  @IsString()
  @MaxLength(1000)
  reason!: string;

  @IsOptional()
  evidence?: any; // JSON
}