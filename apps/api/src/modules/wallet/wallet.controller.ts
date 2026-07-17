//path: apps/api/src/modules/wallet/wallet.controller.ts
"use client";

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { NotificationType, WalletRole } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { Roles } from "../../common/auth/roles.decorator";
import { CryptoService } from "../../common/crypto/crypto.service";
import { PAYSTACK_PROVIDER } from "../payments/payments.constants";
import { PaystackProvider } from "../payments/paystack/paystack.provider";
import { LedgerService } from "./ledger.service";
import { WalletService } from "./wallet.service";
import { InitiateDepositDto } from "./dto/initiate-deposit.dto";
import { WebhookSimulateDto } from "./dto/webhook-simulate.dto";
import { SaveBankDetailsDto } from "./dto/save-bank-details.dto";
import { WithdrawRequestDto } from "./dto/withdraw-request.dto";
import { Public } from "../../common/auth/public.decorator";
import { EscrowLockService } from "./escrow-lock.service";
import { BankDetailsResponse } from "./dto/bank-details.response";
import { WalletHistoryResponse } from "./dto/wallet-history.response";
import { NotificationsService } from "../notifications/notifications.service";
import * as argon2 from "argon2";
import { SetWithdrawalPinDto } from "./dto/set-withdrawal-pin.dto";
import { VerifyWithdrawalPinDto } from "./dto/verify-withdrawal-pin.dto";

@ApiTags("wallet")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("wallet")
export class WalletController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly ledgerService: LedgerService,
    private readonly crypto: CryptoService,
    private readonly escrowLock: EscrowLockService,
    private readonly notifications: NotificationsService,
    @Inject(PAYSTACK_PROVIDER) private readonly paystack: PaystackProvider
  ) {}

  // ==========================
  // Helpers
  // ==========================

  private async getUserRoleCodes(userId: string): Promise<Array<"CLIENT" | "FIXER">> {
    const rows = await this.prisma.userRole.findMany({
      where: { userId },
      select: { role: { select: { code: true } } },
    });

    return rows
      .map((r) => r.role.code)
      .filter((code): code is "CLIENT" | "FIXER" => code === "CLIENT" || code === "FIXER");
  }

  private async resolveBalanceRole(userId: string, requestedRole?: string): Promise<WalletRole> {
    const roles = await this.getUserRoleCodes(userId);

    if (requestedRole) {
      const normalized = requestedRole.trim().toUpperCase();
      if (normalized !== "CLIENT" && normalized !== "FIXER") {
        throw new BadRequestException("INVALID_WALLET_ROLE");
      }
      if (!roles.includes(normalized as any)) {
        throw new BadRequestException("ROLE_NOT_ASSIGNED_TO_USER");
      }
      return normalized === "FIXER" ? WalletRole.FIXER : WalletRole.CLIENT;
    }

    return roles.length === 1 && roles[0] === "FIXER"
      ? WalletRole.FIXER
      : WalletRole.CLIENT;
  }

  // ==========================
  // Balance
  // ==========================

  @Get("balance")
async balance(
  @CurrentUser() user: { userId: string },
  @Query("role") role?: string,
) {
  const walletRole = await this.resolveBalanceRole(user.userId, role);

  // Client balance still comes from wallet
  if (walletRole === WalletRole.CLIENT) {
    const wallet = await this.walletService.getOrCreateWallet(
      user.userId,
      WalletRole.CLIENT,
    );

    return {
      role: WalletRole.CLIENT,
      balanceMilliFec: wallet.balanceMilliFec,
      balanceFec: wallet.balanceMilliFec / 1000,
    };
  }

  // Fixer balance comes from earnings
  const aggregate = await this.prisma.fixerEarning.aggregate({
    where: {
      fixerId: user.userId,
      status: {
        in: ["AVAILABLE", "PARTIALLY_WITHDRAWN"],
      },
    },
    _sum: {
      availableMilliFec: true,
    },
  });

  const balance = aggregate._sum.availableMilliFec ?? 0;

  return {
    role: WalletRole.FIXER,
    balanceMilliFec: balance,
    balanceFec: balance / 1000,
  };
}

  @Get("withdrawable-balance")
@Roles("FIXER")
async withdrawableBalance(@CurrentUser() user: { userId: string }) {
  const aggregate = await this.prisma.fixerEarning.aggregate({
    where: {
      fixerId: user.userId,
      status: {
  in: [
    "AVAILABLE",
    "PARTIALLY_WITHDRAWN",
  ],
},
    },
    _sum: {
      availableMilliFec: true,
    },
  });

  const available = aggregate._sum.availableMilliFec ?? 0;

  return {
    role: WalletRole.FIXER,
    withdrawableBalanceMilliFec: available,
    withdrawableBalanceFec: available / 1000,
  };
}

  // ==========================
  // Deposit
  // ==========================

  @Post("deposits/initiate")
  @Roles("CLIENT")
  async initiateDeposit(@CurrentUser() user: { userId: string }, @Body() dto: InitiateDepositDto) {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { email: true },
    });

    if (!dbUser) throw new BadRequestException("USER_NOT_FOUND");

    const succeeded = await this.prisma.deposit.count({
      where: { userId: user.userId, status: "SUCCEEDED" },
    });

    // First deposit limits
    if (succeeded === 0) {
      if (dto.amountMilliFec < 1000) {
        throw new BadRequestException("FIRST_DEPOSIT_MIN_1000");
      }
      if (dto.amountMilliFec > 2000) {
        throw new BadRequestException("FIRST_DEPOSIT_MAX_2000");
      }
    }

    const base = dto.amountMilliFec;
    const fee = Math.ceil(base * 0.015);
    const absorbed = base > 2500 ? 100 : 0;

    const chargeKobo = (base + fee) * 100;

    const reference = `ps_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    await this.prisma.deposit.create({
      data: {
        userId: user.userId,
        amountMilliFec: base,
        reference,
        status: "PENDING",
      },
    });

    const init = await this.paystack.initializeTransaction({
      email: dbUser.email,
      amountKobo: chargeKobo,
      reference,
      metadata: { base, fee, absorbed },
    });

    return {
      reference: init.reference,
      authorizationUrl: init.authorizationUrl,
      amountMilliFec: base,
      fee: { clientFeeNaira: fee, platformAbsorbedExtraNaira: absorbed },
    };
  }

  // ==========================
  // Webhook (Simulated)
  // ==========================

  @Public()
  @Post("deposits/webhook-simulate")
  async webhookSimulate(@Body() dto: WebhookSimulateDto) {
    const deposit = await this.prisma.deposit.findUnique({
      where: { reference: dto.reference },
    });

    if (!deposit) throw new BadRequestException("DEPOSIT_NOT_FOUND");
    if (deposit.status !== "PENDING") return { ok: true, status: deposit.status };

    if (dto.status === "failed") {
      await this.prisma.deposit.update({
        where: { reference: dto.reference },
        data: { status: "FAILED" },
      });
      return { ok: true, status: "FAILED" };
    }

    await this.prisma.deposit.update({
      where: { reference: dto.reference },
      data: { status: "SUCCEEDED" },
    });

    await this.ledgerService.addEntry({
      userId: deposit.userId,
      role: WalletRole.CLIENT,
      type: "DEPOSIT",
      direction: "CREDIT",
      amountMilliFec: deposit.amountMilliFec,
      idempotencyKey: `deposit:${deposit.reference}`,
      reference: deposit.reference,
    });

    await this.notifications.create({
      userId: deposit.userId,
      type: NotificationType.DEPOSIT_SUCCEEDED,
      title: "Deposit received",
      body: `Your wallet has been credited with ${(deposit.amountMilliFec / 1000).toFixed(2)} FEC.`,
      idempotencyKey: `notif:deposit:${deposit.reference}`,
      data: {
        reference: deposit.reference,
        amountMilliFec: deposit.amountMilliFec,
      },
    });

    return { ok: true, status: "SUCCEEDED" };
  }

  // ==========================
  // Bank Details
  // ==========================

  @Get("bank-details")
  @Roles("FIXER")
  async getBankDetails(@CurrentUser() user: { userId: string }): Promise<BankDetailsResponse> {
    const bank = await this.prisma.bankDetails.findUnique({
      where: { userId: user.userId },
    });

    if (!bank) {
      return {
        hasBankDetails: false,
        bankName: null,
        accountName: null,
        accountNumber: null,
        updatedAt: null,
      };
    }

    return {
      hasBankDetails: true,
      bankName: bank.bankName,
      accountName: bank.accountName,
      accountNumber: bank.accountNumber,
      updatedAt: bank.updatedAt?.toISOString() ?? null,
    };
  }

@Post("bank-details")
@Roles("FIXER")
async saveBankDetails(@CurrentUser() user: { userId: string }, @Body() dto: SaveBankDetailsDto) {
  const encrypted = this.crypto.encryptAes256Gcm(dto.bvn);

  let recipientCode: string | null = null;

  const payoutsEnabled = process.env.PAYSTACK_PAYOUTS_ENABLED === "true";
  if (payoutsEnabled && dto.bankCode) {
    try {
      const recipient = await this.paystack.createTransferRecipient({
        name: dto.accountName,
        accountNumber: dto.accountNumber,
        bankCode: dto.bankCode,
      });
      recipientCode = recipient.recipientCode;
    } catch (err) {
      console.error("Paystack recipient creation failed:", err);
    }
  }

  // Use dummy bank code if not provided (required by DB)
  const finalBankCode = dto.bankCode ?? "000000";

  const record = await this.prisma.bankDetails.upsert({
    where: { userId: user.userId },
    update: {
      bankName: dto.bankName,
      accountName: dto.accountName,
      accountNumber: dto.accountNumber,
      bankCode: finalBankCode,
      bvnEncrypted: encrypted.ciphertextB64,
      bvnIv: encrypted.ivB64,
      paystackRecipientCode: recipientCode,
    },
    create: {
      userId: user.userId,
      bankName: dto.bankName,
      accountName: dto.accountName,
      accountNumber: dto.accountNumber,
      bankCode: finalBankCode,
      bvnEncrypted: encrypted.ciphertextB64,
      bvnIv: encrypted.ivB64,
      paystackRecipientCode: recipientCode,
    },
  });

  return {
    ok: true,
    bankName: record.bankName,
    accountName: record.accountName,
    accountNumber: record.accountNumber,
    hasRecipientCode: Boolean(record.paystackRecipientCode),
  };
}

  // ==========================
  // History
  // ==========================

  @Get("deposits/history")
  @Roles("CLIENT")
  async depositHistory(@CurrentUser() user: { userId: string }): Promise<WalletHistoryResponse> {
    const rows = await this.prisma.deposit.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return {
      items: rows.map((r) => ({
        id: r.id,
        amountMilliFec: r.amountMilliFec,
        reference: r.reference,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  @Get("withdrawals/history")
  @Roles("FIXER")
  async withdrawalHistory(@CurrentUser() user: { userId: string }) {
    const items = await this.prisma.withdrawalRequest.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return { items };
  }
@Post("set-withdrawal-pin")
@Roles("FIXER")
async setWithdrawalPin(@CurrentUser() user: { userId: string }, @Body() dto: SetWithdrawalPinDto) {
  const userRecord = await this.prisma.user.findUnique({
    where: { id: user.userId },
    select: { withdrawalPinHash: true },
  });
  if (!userRecord) throw new BadRequestException("USER_NOT_FOUND");

  const hasCurrent = !!userRecord.withdrawalPinHash;

  if (hasCurrent) {
    // Require current pin to change
    if (!dto.currentPin) throw new BadRequestException("CURRENT_PIN_REQUIRED");
    const isValid = await argon2.verify(userRecord.withdrawalPinHash!, dto.currentPin);
    if (!isValid) throw new BadRequestException("INVALID_CURRENT_PIN");
  }

  const newHash = await argon2.hash(dto.newPin);
  await this.prisma.user.update({
    where: { id: user.userId },
    data: { withdrawalPinHash: newHash },
  });

  return { ok: true, message: hasCurrent ? "PIN updated" : "PIN set" };
}
@Get("withdrawal-pin-status")
@Roles("FIXER")
async withdrawalPinStatus(@CurrentUser() user: { userId: string }) {
  const userRecord = await this.prisma.user.findUnique({
    where: { id: user.userId },
    select: { withdrawalPinHash: true },
  });
  return { hasPin: !!userRecord?.withdrawalPinHash };
}

@Post("verify-withdrawal-pin")
@Roles("FIXER")
async verifyWithdrawalPin(@CurrentUser() user: { userId: string }, @Body() dto: VerifyWithdrawalPinDto) {
  const userRecord = await this.prisma.user.findUnique({
    where: { id: user.userId },
    select: { withdrawalPinHash: true },
  });
  if (!userRecord) throw new BadRequestException("USER_NOT_FOUND");
  if (!userRecord.withdrawalPinHash) throw new BadRequestException("PIN_NOT_SET");

  const isValid = await argon2.verify(userRecord.withdrawalPinHash!, dto.pin);
  if (!isValid) throw new BadRequestException("INVALID_PIN");

  return { ok: true };
}

  // ==========================
  // Withdrawals
  // ==========================

  @Post("withdrawals/request")
  @Roles("FIXER")
  async requestWithdrawal(@CurrentUser() user: { userId: string }, @Body() dto: WithdrawRequestDto) {

    const bank = await this.prisma.bankDetails.findUnique({
      where: { userId: user.userId },
    });

    if (!bank) throw new BadRequestException("BANK_DETAILS_REQUIRED");
    const userRecord = await this.prisma.user.findUnique({
    where: { id: user.userId },
    select: { withdrawalPinHash: true },
  });
  if (!userRecord?.withdrawalPinHash) throw new BadRequestException("WITHDRAWAL PIN REQUIRED");
  const pinValid = await argon2.verify(userRecord.withdrawalPinHash, dto.pin);
  if (!pinValid) throw new BadRequestException("INCORRECT PIN");

  const earnings = await this.prisma.fixerEarning.findMany({
  where: {
  fixerId: user.userId,
  status: {
    in: [
      "AVAILABLE",
      "PARTIALLY_WITHDRAWN",
    ],
  },
},
  orderBy: {
    createdAt: "asc",
  },
});

const available = earnings.reduce(
  (sum, earning) => sum + earning.availableMilliFec,
  0,
);

if (dto.amountMilliFec > available) {
  throw new BadRequestException("INSUFFICIENT_BALANCE");
}

    const req = await this.prisma.withdrawalRequest.create({
      data: {
        userId: user.userId,
        amountMilliFec: dto.amountMilliFec,
        status: "PENDING",
      },
    });

    let remaining = dto.amountMilliFec;

for (const earning of earnings) {
  if (remaining <= 0) {
    break;
  }

  if (earning.availableMilliFec <= remaining) {
  await this.prisma.fixerEarning.update({
    where: {
      id: earning.id,
    },
    data: {
      availableMilliFec: 0,
      status: "PAID",
      paidAt: null, // This will be set when the payment is actually made
    },
  });

  remaining -= earning.availableMilliFec;
} else {
  await this.prisma.fixerEarning.update({
    where: {
      id: earning.id,
    },
    data: {
      availableMilliFec: earning.availableMilliFec - remaining,
      status: "PARTIALLY_WITHDRAWN",
    },
  });

  remaining = 0;
}
}

    await this.notifications.create({
      userId: user.userId,
      type: NotificationType.WITHDRAWAL_REQUESTED,
      title: "Withdrawal requested",
      body: `Withdrawal request for ${(dto.amountMilliFec / 1000).toFixed(2)} FEC submitted.`,
      idempotencyKey: `notif:withdraw:${req.id}`,
      data: { withdrawalId: req.id },
    });

    return { ok: true, requestId: req.id, status: req.status };
  }
}