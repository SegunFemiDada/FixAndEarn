// Path: /apps/api/src/modules/payments/payments.module.ts
import { Module } from "@nestjs/common";
import { StubPaystackProvider } from "./paystack/stub-paystack.provider";

export const PAYSTACK_PROVIDER = "PAYSTACK_PROVIDER";

@Module({
  providers: [{ provide: PAYSTACK_PROVIDER, useClass: StubPaystackProvider }, StubPaystackProvider],
  exports: [PAYSTACK_PROVIDER]
})
export class PaymentsModule {}
