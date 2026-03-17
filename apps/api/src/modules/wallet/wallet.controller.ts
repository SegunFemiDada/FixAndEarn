//path: apps/api/src/modules/wallet/wallet.controller.ts
import { Body, Controller, Get, Inject, Post, UseGuards, BadRequestException } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { NotificationType } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { Roles } from "../../common/auth/roles.decorator";
import { CryptoService } from "../../common/crypto/crypto.service";
import { PAYSTACK_PROVIDER } from "../payments/payments.module";
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

  @Get("balance")
  async balance(@CurrentUser() user: { userId: string }) {
    const wallet = await this.walletService.getOrCreateWallet(user.userId);
    return {
      balanceMilliFec: wallet.balanceMilliFec,
      balanceFec: wallet.balanceMilliFec / 1000,
    };
  }

  @Get("withdrawable-balance")
  @Roles("FIXER")
  async withdrawableBalance(@CurrentUser() user: { userId: string }) {
    const wallet = await this.walletService.getOrCreateWallet(user.userId);
    const lockedEscrowMilliFec = await this.escrowLock.getLockedEscrowAmountForFixer(user.userId);

    const withdrawableBalanceMilliFec = Math.max(0, wallet.balanceMilliFec - lockedEscrowMilliFec);

    return {
      withdrawableBalanceMilliFec,
      withdrawableBalanceFec: withdrawableBalanceMilliFec / 1000,
    };
  }

  @Post("deposits/initiate")
  async initiateDeposit(@CurrentUser() user: { userId: string }, @Body() dto: InitiateDepositDto) {
    const dbUser = await this.prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) return { error: "User not found" };

    const succeededDeposits = await this.prisma.depositIntent.count({
      where: { userId: user.userId, status: "SUCCEEDED" },
    });

    if (succeededDeposits === 0) {
      if (dto.amountMilliFec < 1000) return { error: "First deposit min is 1.0 FEC (1000 milliFEC)." };
      if (dto.amountMilliFec > 2000) return { error: "First deposit max is 2.0 FEC (2000 milliFEC)." };
    }

    const baseNaira = dto.amountMilliFec;
    const clientFeeNaira = Math.ceil(baseNaira * 0.015);
    const platformAbsorbedExtraNaira = baseNaira > 2500 ? 100 : 0;

    const clientChargeNaira = baseNaira + clientFeeNaira;
    const amountKobo = clientChargeNaira * 100;

    const paystackRef = `ps_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    await this.prisma.depositIntent.create({
      data: {
        userId: user.userId,
        amountMilliFec: dto.amountMilliFec,
        amountKobo,
        paystackRef,
        status: "PENDING",
      },
    });

    const init = await this.paystack.initializeTransaction({
      email: dbUser.email,
      amountKobo,
      reference: paystackRef,
      metadata: { baseNaira, clientFeeNaira, platformAbsorbedExtraNaira },
    });

    return {
      paystackRef: init.reference,
      authorizationUrl: init.authorizationUrl,
      amountMilliFec: dto.amountMilliFec,
      amountKobo,
      fee: { clientFeeNaira, platformAbsorbedExtraNaira },
    };
  }

  @Public()
  @Post("deposits/webhook-simulate")
  async webhookSimulate(@Body() dto: WebhookSimulateDto) {
    const intent = await this.prisma.depositIntent.findUnique({
      where: { paystackRef: dto.paystackRef },
    });

    if (!intent) return { error: "Deposit intent not found" };
    if (intent.status !== "PENDING") return { ok: true, status: intent.status };

    if (dto.status === "failed") {
      await this.prisma.depositIntent.update({
        where: { paystackRef: dto.paystackRef },
        data: { status: "FAILED" },
      });
      return { ok: true, status: "FAILED" };
    }

    await this.prisma.depositIntent.update({
      where: { paystackRef: dto.paystackRef },
      data: { status: "SUCCEEDED" },
    });

    await this.ledgerService.addEntry({
      userId: intent.userId,
      type: "DEPOSIT",
      direction: "CREDIT",
      amountMilliFec: intent.amountMilliFec,
      idempotencyKey: `deposit:${intent.paystackRef}`,
      reference: intent.paystackRef,
      metadata: { amountKobo: intent.amountKobo },
    });

    try {
      await this.notifications.create({
        userId: intent.userId,
        type: NotificationType.DEPOSIT_SUCCEEDED,
        title: "Deposit received",
        body: `Your wallet has been credited with ${(intent.amountMilliFec / 1000).toFixed(2)} FEC.`,
        idempotencyKey: `notif:deposit_succeeded:${intent.paystackRef}`,
        data: {
          paystackRef: intent.paystackRef,
          amountMilliFec: intent.amountMilliFec,
        },
      });
    } catch {}

    return { ok: true, status: "SUCCEEDED" };
  }

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
      updatedAt: bank.updatedAt ? bank.updatedAt.toISOString() : null,
    };
  }

  @Post("bank-details")
  @Roles("FIXER")
  async saveBankDetails(@CurrentUser() user: { userId: string }, @Body() dto: SaveBankDetailsDto) {
    const encrypted = this.crypto.encryptAes256Gcm(dto.bvn);

    const bankCode = dto.bankCode?.trim();
    if (!bankCode) throw new BadRequestException("BANK_CODE_REQUIRED");

    const existing = await this.prisma.bankDetails.findUnique({
      where: { userId: user.userId }
    });

    try {
      await this.paystack.resolveAccountNumber(dto.accountNumber, bankCode);
    } catch {}

    const shouldCreateRecipient =
      !existing?.paystackRecipientCode ||
      existing.bankName !== dto.bankName ||
      existing.accountNumber !== dto.accountNumber ||
      existing.accountName !== dto.accountName ||
      existing.bankCode !== bankCode;

    let recipientCode = existing?.paystackRecipientCode ?? null;

    if (shouldCreateRecipient) {
      const recipient = await this.paystack.createTransferRecipient({
        name: dto.accountName,
        accountNumber: dto.accountNumber,
        bankCode
      });
      recipientCode = recipient.recipientCode;
    }

    const record = await this.prisma.bankDetails.upsert({
      where: { userId: user.userId },
      update: {
        bankName: dto.bankName,
        accountName: dto.accountName,
        accountNumber: dto.accountNumber,
        bankCode,
        bvnEncrypted: encrypted.ciphertextB64,
        bvnIv: encrypted.ivB64,
        paystackRecipientCode: recipientCode
      },
      create: {
        userId: user.userId,
        bankName: dto.bankName,
        accountName: dto.accountName,
        accountNumber: dto.accountNumber,
        bankCode,
        bvnEncrypted: encrypted.ciphertextB64,
        bvnIv: encrypted.ivB64,
        paystackRecipientCode: recipientCode
      }
    });

    return {
      ok: true,
      bankName: record.bankName,
      accountName: record.accountName,
      accountNumber: record.accountNumber,
      hasRecipientCode: Boolean(record.paystackRecipientCode)
    };
  }

  @Get("deposits/history")
  @Roles("CLIENT")
  async depositHistory(@CurrentUser() user: { userId: string }): Promise<WalletHistoryResponse> {
    const rows = await this.prisma.depositIntent.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        amountMilliFec: true,
        amountKobo: true,
        paystackRef: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      items: rows.map((r) => ({
        id: r.id,
        amountMilliFec: r.amountMilliFec,
        amountKobo: r.amountKobo,
        paystackRef: r.paystackRef,
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

  @Post("withdrawals/request")
  @Roles("FIXER")
  async requestWithdrawal(@CurrentUser() user: { userId: string }, @Body() dto: WithdrawRequestDto) {
    const wallet = await this.walletService.getOrCreateWallet(user.userId);

    const bank = await this.prisma.bankDetails.findUnique({ where: { userId: user.userId } });
    if (!bank) return { error: "Bank details required before requesting withdrawal." };

    const lockedEscrowMilliFec = await this.escrowLock.getLockedEscrowAmountForFixer(user.userId);
    const withdrawableBalanceMilliFec = Math.max(0, wallet.balanceMilliFec - lockedEscrowMilliFec);

    if (dto.amountMilliFec > withdrawableBalanceMilliFec) {
      return { error: "Insufficient withdrawable balance." };
    }

    const req = await this.prisma.withdrawalRequest.create({
      data: { userId: user.userId, amountMilliFec: dto.amountMilliFec, status: "PENDING" },
    });

    await this.ledgerService.addEntry({
      userId: user.userId,
      type: "WITHDRAWAL_REQUEST",
      direction: "DEBIT",
      amountMilliFec: dto.amountMilliFec,
      idempotencyKey: `withdraw_req:${req.id}`,
      reference: req.id,
    });

    try {
      await this.notifications.create({
        userId: user.userId,
        type: NotificationType.WITHDRAWAL_REQUESTED,
        title: "Withdrawal requested",
        body: `Your withdrawal request for ${(dto.amountMilliFec / 1000).toFixed(2)} FEC has been submitted.`,
        idempotencyKey: `notif:withdrawal_requested:${req.id}`,
        data: {
          withdrawalId: req.id,
          amountMilliFec: dto.amountMilliFec,
        },
      });
    } catch {}

    return { ok: true, requestId: req.id, status: req.status };
  }
}