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
      "https://fixandearn.vercel.app",
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

  afterInit() {
    console.log(
      "CHAT GATEWAY INITIALIZED"
    );
  }

  handleConnection(
    client: Socket
  ) {
    console.log(
      "CHAT CONNECTED",
      client.id
    );
  }

  handleDisconnect(
    client: Socket
  ) {
    console.log(
      "CHAT DISCONNECTED",
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

    console.log(
    "[CHAT JOIN]",
    client.id,
    room
    );

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

    console.log(
    "[CHAT LEAVE]",
    client.id,
    room
  );

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
    console.log(
      "EMIT",
      event,
      room
    );

    this.server
      .to(room)
      .emit(
        event,
        payload
      );
  }
}