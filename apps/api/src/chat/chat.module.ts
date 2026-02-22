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


@Module({
  imports: [UsersModule, WalletModule, NotificationsModule],
  controllers: [ChatController, ChatQueryController, AdminModerationController],
  providers: [ChatService, ChatRepo, ChatModerationService],
  exports: [ChatService],
})
export class ChatModule {}
