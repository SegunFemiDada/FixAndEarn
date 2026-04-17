import { Module } from "@nestjs/common";
import { PhoneVerificationController } from "./phone-verification.controller";
import { PhoneVerificationService } from "./phone-verification.service";
import { SmsModule } from "../sms/sms.module";
import { PrismaModule } from "../../infra/prisma/prisma.module";

@Module({
  imports: [SmsModule, PrismaModule],
  controllers: [PhoneVerificationController],
  providers: [PhoneVerificationService],
})
export class PhoneVerificationModule {}