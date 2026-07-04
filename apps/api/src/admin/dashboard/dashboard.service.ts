//path: apps/api/src/admin/dashboard/dashboard.service.ts
import { Injectable } from "@nestjs/common";
import { DashboardRepo } from "./dashboard.repo";

@Injectable()
export class DashboardService {
  constructor(
    private readonly repo: DashboardRepo,
  ) {}

  async getDashboard() {
    const [
      users,
      verification,
      jobs,
      deposits,
      withdrawals,
      reports,
      disputes,
      admins,
      recentActivity,
    ] = await Promise.all([
      this.repo.getUserStats(),
      this.repo.getVerificationStats(),
      this.repo.getJobStats(),
      this.repo.getDepositStats(),
      this.repo.getWithdrawalStats(),
      this.repo.getReportStats(),
      this.repo.getDisputeStats(),
      this.repo.getAdminStats(),
      this.repo.getRecentActivity(),
    ]);

    return {
      users,

      verification,

      jobs,

      deposits,

      withdrawals,

      reports,

      disputes,

      admins,

      recentActivity,

      system: {
        healthy: true,
        generatedAt: new Date(),
      },
    };
  }
}