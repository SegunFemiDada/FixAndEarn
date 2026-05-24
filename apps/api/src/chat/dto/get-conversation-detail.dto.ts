//path: apps/api/src/chat/dto/get-conversation-detail.dto.ts
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class GetConversationDetailDto {
  // Cursor is a ChatMessage.id (unique)
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  take?: number = 30;
}