import { IsOptional, IsString, MaxLength } from "class-validator";

export class AdminUserActionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
