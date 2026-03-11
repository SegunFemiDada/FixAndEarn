//path: apps/api/src/admin/verification/dto/verification-decision.dto.ts
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class VerificationDecisionDto {
  @IsIn(["APPROVE", "REJECT", "REQUEST_REUPLOAD"])
  action!: "APPROVE" | "REJECT" | "REQUEST_REUPLOAD";

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
