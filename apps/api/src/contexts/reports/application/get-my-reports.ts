import { ReportRepository } from '../domain/ports/report.repository';
import { ReportSnapshot } from '../domain/report';

export interface GetMyReportsQuery {
  emergencyId: string;
  userId: string;
}

export class GetMyReports {
  constructor(private readonly repo: ReportRepository) {}

  async execute(query: GetMyReportsQuery): Promise<ReportSnapshot[]> {
    const reports = await this.repo.findByEmergencyIdAndReporter(
      query.emergencyId,
      query.userId,
    );
    return reports.map((r) => r.toSnapshot());
  }
}
