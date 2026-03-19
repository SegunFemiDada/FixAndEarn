// Path: apps/api/src/modules/disputes/dto/admin-dispute-chat-message.dto.ts
import { IsString, MaxLength, MinLength } from "class-validator";

export class AdminDisputeChatMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  body!: string;
}