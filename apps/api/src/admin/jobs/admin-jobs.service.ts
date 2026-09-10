import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { JobPostingType, JobStatus } from "@prisma/client";
import { AdminJobsRepo } from "./admin-jobs.repo";

@Injectable()
export class AdminJobsService {
  constructor(private readonly repo: AdminJobsRepo) {}

  async list(args: {
    q?: string;
    status?: JobStatus;
    postingType?: JobPostingType;
    clientId?: string;
    fixerId?: string;
    skip?: number;
    take?: number;
  }) {
    const skip = Math.max(0, args.skip ?? 0);
    const take = Math.min(Math.max(1, args.take ?? 20), 100);

    return this.repo.listJobs({
      q: args.q,
      status: args.status,
      postingType: args.postingType,
      clientId: args.clientId,
      fixerId: args.fixerId,
      skip,
      take,
    });
  }

  async getOne(jobId: string) {
    const job = await this.repo.getJob(jobId);

    if (!job) {
      throw new NotFoundException("JOB_NOT_FOUND");
    }

    return job;
  }
}