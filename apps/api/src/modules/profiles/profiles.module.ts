//path: apps/api/src/modules/profiles/profiles.module.ts
import { Module } from "@nestjs/common";
import { ProfilesController } from "./profiles.controller";
import { PrismaService } from "../../infra/prisma/prisma.service";

@Module({
  controllers: [ProfilesController],
  providers: [PrismaService],
})
export class ProfilesModule {}