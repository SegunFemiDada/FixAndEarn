import { Module } from "@nestjs/common";
import { PrismaModule } from "../../infra/prisma/prisma.module";
import { JobCompletionRepo } from "./job-completion.repo";
import { JobCompletionService } from "./job-completion.service";
import { JobCompletionController } from "./job-completion.controller";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [JobCompletionController],
  providers: [
    JobCompletionRepo,
    JobCompletionService,
  ],
  exports: [
    JobCompletionService,
    JobCompletionRepo,
  ],
})
export class JobCompletionModule {}