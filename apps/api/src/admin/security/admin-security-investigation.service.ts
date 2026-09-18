import { Injectable } from "@nestjs/common";
import { AdminSecurityInvestigationRepo } from "./admin-security-investigation.repo";

@Injectable()
export class AdminSecurityInvestigationService {
  constructor(private readonly repo: AdminSecurityInvestigationRepo) {}

  getInvestigation(logId: string) {
    return this.repo.getInvestigation(logId);
  }
}
