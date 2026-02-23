import { Module } from "@nestjs/common";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { ChatRepo } from "./chat.repo";
import { ChatModerationService } from "./moderation/chat-moderation.service";
import { ChatQueryController } from "./chat.query.controller";
import { AdminModerationController } from "./admin-moderation.controller";
import { UsersModule } from "../modules/users/users.module";
import { WalletModule } from "../modules/wallet/wallet.module";
import { NotificationsModule } from "../modules/notifications/notifications.module";
import { ConfigModule } from "@nestjs/config";
import { ChatRealtimeService } from "./realtime/chat-realtime.service";
import { ChatRealtimeController } from "./realtime/chat-realtime.controller";

@Module({
  imports: [UsersModule, WalletModule, NotificationsModule, ConfigModule],
  controllers: [
    ChatController,
    ChatQueryController,
    AdminModerationController,
    ChatRealtimeController
  ],
  providers: [ChatService, ChatRepo, ChatModerationService, ChatRealtimeService],
  exports: [ChatService],
})
export class ChatModule {}