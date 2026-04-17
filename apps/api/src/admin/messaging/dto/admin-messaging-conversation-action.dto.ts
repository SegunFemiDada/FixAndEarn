import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class AdminMessagingConversationActionDto {
  @IsIn(["CLIENT", "FIXER", "BOTH"])
  target!: "CLIENT" | "FIXER" | "BOTH";

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}