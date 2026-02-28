// Path: apps/api/src/chat/chat.query.controller.ts
import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { ChatService } from "./chat.service";
import { ListMyConversationsDto } from "./dto/list-my-conversations.dto";
import { ListJobConversationsDto } from "./dto/list-job-conversations.dto";
import { GetConversationDetailDto } from "./dto/get-conversation-detail.dto";
import { CurrentUserPayload } from "src/common/types/current-user";

function pickUserId(user: CurrentUserPayload): string {
  const id = user.userId ?? user.id ?? user.sub;
  if (!id) throw new Error("CURRENT_USER_ID_MISSING");
  return String(id);
}

@UseGuards(JwtAuthGuard)
@Controller()
export class ChatQueryController {
  constructor(private readonly chat: ChatService) {}

  @Get("chats/me")
  async myConversations(@CurrentUser() user: CurrentUserPayload, @Query() q: ListMyConversationsDto) {
    const userId = pickUserId(user);
    return this.chat.listMyConversations(userId, q);
  }

  @Get("jobs/:jobId/chats")
  async jobConversations(
    @Param("jobId") jobId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Query() q: ListJobConversationsDto
  ) {
    const userId = pickUserId(user);
    return this.chat.listJobConversations(jobId, userId, q);
  }

  @Get("jobs/:jobId/chats/:fixerId")
  async detail(
    @Param("jobId") jobId: string,
    @Param("fixerId") fixerId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Query() q: GetConversationDetailDto
  ) {
    const userId = pickUserId(user);
    return this.chat.getConversationDetail(jobId, fixerId, userId, q);
  }
}
