//path: apps/api/src/modules/job-completion/job-completion.module.ts
import { forwardRef, Module } from "@nestjs/common";
import { PrismaModule } from "../../infra/prisma/prisma.module";
import { JobsRepo } from "../jobs/jobs.repo";
import { JobCompletionRepo } from "./job-completion.repo";
import { JobCompletionService } from "./job-completion.service";
import { JobCompletionController } from "./job-completion.controller";
import { JobsModule } from "../jobs/jobs.module";

@Module({
  imports: [PrismaModule,
    forwardRef(() => JobsModule),
  ],
  controllers: [JobCompletionController],
  providers: [JobsRepo, JobCompletionRepo, JobCompletionService],
  exports: [JobCompletionService, JobCompletionRepo],
})
export class JobCompletionModule {}
