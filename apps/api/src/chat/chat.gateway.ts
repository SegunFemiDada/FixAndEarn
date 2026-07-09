//path: apps/api/src/chat/chat.gateway.ts
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";

import {
  Server,
  Socket,
} from "socket.io";

@WebSocketGateway({
  cors: {
    origin: [
      "https://fixandearn.com",
    ],
    credentials: true,
    methods: [
      "GET",
      "POST",
    ],
  },
})
export class ChatGateway
  implements
    OnGatewayConnection,
    OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  afterInit() {}

  handleConnection(
    _client: Socket
  ) {}

  handleDisconnect(
    _client: Socket
  ) {}

  @SubscribeMessage("join")
  handleJoin(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    payload: {
      jobId: string;
      fixerId: string;
    }
  ) {
    const room =
      `job:${payload.jobId}:fixer:${payload.fixerId}`;

    client.join(room);

    return {
      joined: room,
    };
  }

  @SubscribeMessage("leave")
  handleLeave(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    payload: {
      jobId: string;
      fixerId: string;
    }
  ) {
    const room =
      `job:${payload.jobId}:fixer:${payload.fixerId}`;

    client.leave(room);

    return {
      left: room,
    };
  }

  @SubscribeMessage("typing:update")
  handleTyping(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    payload: {
      jobId: string;
      fixerId: string;
      typing: boolean;
    }
  ) {
    const room =
      `job:${payload.jobId}:fixer:${payload.fixerId}`;

    client.to(room).emit(
      "typing:update",
      {
        ...payload,
        userId: client.id,
      }
    );
  }

  emitToRoom(
    room: string,
    event: string,
    payload: any
  ) {
    this.server
      .to(room)
      .emit(
        event,
        payload
      );
  }
}