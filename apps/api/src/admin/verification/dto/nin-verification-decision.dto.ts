import { IsIn, IsString, MaxLength } from "class-validator";

export class NinVerificationDecisionDto {
  @IsIn(["VERIFY", "FAIL"])
  action!: "VERIFY" | "FAIL";

  @IsString()
  @MaxLength(500)
  note!: string;
}