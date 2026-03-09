//path: apps/api/src/chat/realtime/chat-realtime.controller.ts
import { Controller, Get, Param, Req, Res, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { ChatRealtimeService } from "./chat-realtime.service";
import type { Response } from "express";

@UseGuards(JwtAuthGuard)
@Controller("jobs/:jobId/chats/:fixerId")
export class ChatRealtimeController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: ChatRealtimeService
  ) {}

  @Get("stream")
  async stream(@Req() req: any, @Res() res: Response, @Param("jobId") jobId: string, @Param("fixerId") fixerId: string) {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).end();
      return;
    }

    // Must be participant
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, clientId: true, fixerId: true }
    });
    if (!job) {
      res.status(404).end();
      return;
    }

    const isClient = job.clientId === userId;
    const isFixer = fixerId === userId;
    if (!isClient && !isFixer) {
      res.status(403).end();
      return;
    }

    // Must have agreement (same rule as your chat detail)
    const convo = await this.prisma.conversation.findUnique({
      where: { jobId_fixerId: { jobId, fixerId } },
      select: { id: true }
    });
    if (!convo) {
      res.status(404).end();
      return;
    }

    const agreement = await this.prisma.chatAgreement.findUnique({
      where: { conversationId_userId: { conversationId: convo.id, userId } },
      select: { acceptedAt: true }
    });
    if (!agreement?.acceptedAt) {
      res.status(403).end();
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    // If you have reverse proxy, this helps
    res.flushHeaders?.();

    const room = this.realtime.roomFor(jobId, fixerId);

    // initial ping so client knows it’s connected
    res.write(`event: ping\ndata: ${JSON.stringify({ ok: true })}\n\n`);

    const unsubscribe = this.realtime.subscribe(room, (ev) => {
      res.write(`event: ${ev.type}\n`);
      res.write(`data: ${JSON.stringify(ev.payload ?? {})}\n\n`);
    });

    const heartbeat = setInterval(() => {
      res.write(`event: ping\ndata: ${JSON.stringify({ t: Date.now() })}\n\n`);
    }, 25000);

    req.on("close", () => {
      clearInterval(heartbeat);
      unsubscribe();
      res.end();
    });
  }
}