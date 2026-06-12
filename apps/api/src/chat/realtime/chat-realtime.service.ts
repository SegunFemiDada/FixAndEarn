//path: apps/api/src/chat/realtime/chat-realtime.service.ts
import { Injectable } from "@nestjs/common";
import { ChatGateway } from "../chat.gateway";

@Injectable()
export class ChatRealtimeService {
  constructor(
    private readonly chatGateway: ChatGateway
  ) {}

  roomFor(
    jobId: string,
    fixerId: string
  ) {
    return `job:${jobId}:fixer:${fixerId}`;
  }

  emitToRoom(
    room: string,
    event: string,
    payload: any
  ) {
    this.chatGateway.emitToRoom(
      room,
      event,
      payload
    );
  }
}