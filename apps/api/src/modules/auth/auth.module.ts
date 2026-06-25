//path: apps/api/src/modules/auth/auth.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { PrismaModule } from "../../infra/prisma/prisma.module";
import { EmailModule } from "../email/email.module"; // add

@Module({
  imports: [
    UsersModule,
    PrismaModule,
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_ACCESS_SECRET"),
        signOptions: {
          expiresIn: config.get<string>("JWT_ACCESS_EXPIRES_IN", "1d"),
        },
      }),
    }),
    EmailModule, // add
  ],
  controllers: [AuthController],
  providers: [
  AuthService,
  JwtStrategy,
],
})
export class AuthModule {}