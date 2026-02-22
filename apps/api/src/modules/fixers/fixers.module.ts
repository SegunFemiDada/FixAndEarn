// Path: apps/api/src/modules/fixers/fixers.module.ts
import { Module } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { FixersController } from "./fixers.controller";
import { FixersService } from "./fixers.service";

@Module({
  controllers: [FixersController],
  providers: [FixersService, PrismaService],
})
export class FixersModule {}