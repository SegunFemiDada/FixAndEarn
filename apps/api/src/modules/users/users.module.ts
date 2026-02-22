// Path: /apps/api/src/modules/users/users.module.ts
import { Module } from "@nestjs/common";
import { UsersRepo } from "./users.repo";
import { UsersService } from "./users.service";

@Module({
  providers: [UsersRepo, UsersService],
  exports: [UsersService]
})
export class UsersModule {}
