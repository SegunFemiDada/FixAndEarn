// Path: apps/api/src/admin/users/admin-deletion-dependency.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AdminDeletionDependencyRepo } from "./admin-deletion-dependency.repo";

@Injectable()
export class AdminDeletionDependencyService {
  constructor(private readonly repo: AdminDeletionDependencyRepo) {}

  async getDependencies(userId: string) {
    const data = await this.repo.getDependencies(userId);

    if (!data.user) {
      throw new NotFoundException("USER_NOT_FOUND");
    }

    const walletBalances = data.wallets.filter(
      (wallet) => wallet.balanceMilliFec !== 0,
    );

    const availableEarningsMilliFec = data.availableEarnings.reduce(
      (sum, earning) => sum + earning.availableMilliFec,
      0,
    );

    const pendingWithdrawalMilliFec = data.pendingWithdrawals.reduce(
      (sum, withdrawal) => sum + withdrawal.amountMilliFec,
      0,
    );

    const pendingDepositMilliFec = data.pendingDeposits.reduce(
      (sum, deposit) => sum + deposit.amountMilliFec,
      0,
    );

    const pendingJobPaymentMilliFec = data.pendingJobPayments.reduce(
      (sum, payment) =>
        sum + payment.amountMilliFec + payment.paymentFeeMilliFec,
      0,
    );

    const blockers = [
      ...(data.activeJobsPosted.length > 0
        ? [
            {
              code: "ACTIVE_JOBS_POSTED",
              title: "Active jobs posted by user",
              count: data.activeJobsPosted.length,
              amountMilliFec: null,
              items: data.activeJobsPosted,
            },
          ]
        : []),
      ...(data.activeJobsAssigned.length > 0
        ? [
            {
              code: "ACTIVE_JOBS_ASSIGNED",
              title: "Active jobs assigned to user",
              count: data.activeJobsAssigned.length,
              amountMilliFec: null,
              items: data.activeJobsAssigned,
            },
          ]
        : []),
      ...(data.pendingApplications.length > 0
        ? [
            {
              code: "PENDING_APPLICATIONS",
              title: "Pending job applications",
              count: data.pendingApplications.length,
              amountMilliFec: null,
              items: data.pendingApplications,
            },
          ]
        : []),
      ...(data.openDisputes.length > 0
        ? [
            {
              code: "OPEN_DISPUTES",
              title: "Open disputes",
              count: data.openDisputes.length,
              amountMilliFec: null,
              items: data.openDisputes,
            },
          ]
        : []),
      ...(data.pendingWithdrawals.length > 0
        ? [
            {
              code: "PENDING_WITHDRAWALS",
              title: "Pending withdrawals",
              count: data.pendingWithdrawals.length,
              amountMilliFec: pendingWithdrawalMilliFec,
              items: data.pendingWithdrawals,
            },
          ]
        : []),
      ...(data.pendingDeposits.length > 0
        ? [
            {
              code: "PENDING_DEPOSITS",
              title: "Pending deposits",
              count: data.pendingDeposits.length,
              amountMilliFec: pendingDepositMilliFec,
              items: data.pendingDeposits,
            },
          ]
        : []),
      ...(data.pendingJobPayments.length > 0
        ? [
            {
              code: "PENDING_JOB_PAYMENTS",
              title: "Pending job payments",
              count: data.pendingJobPayments.length,
              amountMilliFec: pendingJobPaymentMilliFec,
              items: data.pendingJobPayments,
            },
          ]
        : []),
      ...(availableEarningsMilliFec > 0
        ? [
            {
              code: "AVAILABLE_EARNINGS",
              title: "Available fixer earnings",
              count: data.availableEarnings.length,
              amountMilliFec: availableEarningsMilliFec,
              items: data.availableEarnings,
            },
          ]
        : []),
      ...(data.pendingCompletionRequests.length > 0
        ? [
            {
              code: "PENDING_COMPLETION_REQUESTS",
              title: "Pending completion requests",
              count: data.pendingCompletionRequests.length,
              amountMilliFec: null,
              items: data.pendingCompletionRequests,
            },
          ]
        : []),
      ...(walletBalances.length > 0
        ? [
            {
              code: "NON_ZERO_WALLET_BALANCES",
              title: "Non-zero wallet balances",
              count: walletBalances.length,
              amountMilliFec: walletBalances.reduce(
                (sum, wallet) => sum + wallet.balanceMilliFec,
                0,
              ),
              items: walletBalances,
            },
          ]
        : []),
    ];

    return {
      user: data.user,
      canApprove: blockers.length === 0,
      blockers,
      warnings: {
        openConversations: data.openConversations,
        bankDetailsPresent: Boolean(data.bankDetails),
        verificationPresent: Boolean(data.verification),
        verificationStatus: data.verification?.status ?? null,
        verificationFilesPresent: Boolean(
          data.verification?.ninImagePath ||
            data.verification?.selfieImagePath ||
            data.verification?.utilityBillPath,
        ),
        ledgerEntryCount: data.ledgerEntryCount,
      },
      summary: {
        walletCount: data.wallets.length,
        nonZeroWalletCount: walletBalances.length,
        activeJobsPostedCount: data.activeJobsPosted.length,
        activeJobsAssignedCount: data.activeJobsAssigned.length,
        pendingApplicationsCount: data.pendingApplications.length,
        openDisputesCount: data.openDisputes.length,
        pendingWithdrawalsCount: data.pendingWithdrawals.length,
        pendingDepositsCount: data.pendingDeposits.length,
        pendingJobPaymentsCount: data.pendingJobPayments.length,
        availableEarningsMilliFec: availableEarningsMilliFec,
        pendingCompletionRequestsCount:
          data.pendingCompletionRequests.length,
        openConversationsCount: data.openConversations.length,
        ledgerEntryCount: data.ledgerEntryCount,
      },
    };
  }

  async assertCanApprove(userId: string) {
    const dependencies = await this.getDependencies(userId);

    if (!dependencies.canApprove) {
      throw new BadRequestException({
        code: "DELETION_BLOCKED_BY_DEPENDENCIES",
        message: "User has unresolved dependencies that must be cleared before deletion can be approved.",
        dependencies,
      });
    }

    return dependencies;
  }
}
