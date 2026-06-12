import {
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
} from "@nestjs/websockets";

import { Server, Socket } from "socket.io";

@WebSocketGateway({
  namespace: "/chat",
  cors: {
    origin: "*",
    credentials: true,
  },
})
export class ChatGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  afterInit() {
    console.log(
      "CHAT GATEWAY INITIALIZED"
    );
  }

  handleConnection(
    client: Socket
  ) {
    console.log(
      "CHAT CONNECTED:",
      client.id
    );
  }

  handleDisconnect(
    client: Socket
  ) {
    console.log(
      "CHAT DISCONNECTED:",
      client.id
    );
  }

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

  emitToRoom(
    room: string,
    event: string,
    payload: any
  ) {
    this.server
      .to(room)
      .emit(event, payload);
  }
}