import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class VerificationDecisionDto {
  @IsIn(["APPROVE", "REJECT", "REQUEST_REUPLOAD"])
  action!: "APPROVE" | "REJECT" | "REQUEST_REUPLOAD";

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
