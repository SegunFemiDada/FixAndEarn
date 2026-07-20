//path: apps/api/src/chat/chat.module.ts
import { Module, forwardRef  } from "@nestjs/common";
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
import { AuthModule } from "src/modules/auth/auth.module";
import { ChatGateway } from "./chat.gateway";
import { JobPaymentsModule } from "../modules/job-payments/job-payments.module";

@Module({
  imports: [UsersModule, NotificationsModule, ConfigModule, forwardRef(() => WalletModule), forwardRef(() => JobPaymentsModule), AuthModule],
  controllers: [
    ChatController,
    ChatQueryController,
    AdminModerationController
  ],
  providers: [ChatService, ChatRepo, ChatModerationService, ChatRealtimeService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}