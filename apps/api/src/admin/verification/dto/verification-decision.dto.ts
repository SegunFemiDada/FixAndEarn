// Path: apps/api/src/admin/verification/dto/verification-decision.dto.ts
import { IsArray, IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class VerificationDecisionDto {
  @IsIn(["APPROVE", "REJECT", "REQUEST_REUPLOAD"])
  action!: "APPROVE" | "REJECT" | "REQUEST_REUPLOAD";

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  reuploadFields?: string[];
}