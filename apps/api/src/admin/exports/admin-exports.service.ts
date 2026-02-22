import { Injectable } from "@nestjs/common";
import { AdminExportsRepo } from "./admin-exports.repo";

function csvEscape(v: any): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  // wrap if contains comma, quote, newline
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

@Injectable()
export class AdminExportsService {
  constructor(private readonly repo: AdminExportsRepo) {}

  async *exportAuditLogsCsv(args: {
    actorAdminId?: string;
    action?: string;
    from?: string;
    to?: string;
    take?: number;
  }) {
    const from = args.from ? new Date(args.from) : undefined;
    const to = args.to ? new Date(args.to) : undefined;

    const totalTake = Math.min(args.take ?? 5000, 50000);
    const pageSize = 1000;

    yield "createdAt,actorAdminId,action,description,ip,userAgent,metadata\n";

    let skip = 0;
    while (skip < totalTake) {
      const batch = await this.repo.listAuditLogs({
        actorAdminId: args.actorAdminId,
        action: args.action,
        from,
        to,
        take: Math.min(pageSize, totalTake - skip),
        skip
      });

      if (batch.length === 0) break;

      for (const row of batch) {
        const metadata = row.metadata ? JSON.stringify(row.metadata) : "";
        yield [
          csvEscape(row.createdAt.toISOString()),
          csvEscape(row.actorAdminId),
          csvEscape(row.action),
          csvEscape(row.description),
          csvEscape(row.ip ?? ""),
          csvEscape(row.userAgent ?? ""),
          csvEscape(metadata)
        ].join(",") + "\n";
      }

      skip += batch.length;
      if (batch.length < pageSize) break;
    }
  }
}
