//path: apps/api/src/chat/dto/list-my-conversations.dto.ts
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";

export class ListMyConversationsDto {
  @IsOptional()
  @IsIn(["OPEN", "CLOSED"])
  status?: "OPEN" | "CLOSED";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  take?: number = 20;
}
