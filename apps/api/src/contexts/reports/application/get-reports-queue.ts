import {
  ReportRepository,
  ReportQueueFilters,
} from '../domain/ports/report.repository';
import { ReportSnapshot } from '../domain/report';

export interface GetReportsQueueQuery {
  emergencyId: string;
  filters?: ReportQueueFilters;
}

export class GetReportsQueue {
  constructor(private readonly repo: ReportRepository) {}

  async execute(query: GetReportsQueueQuery): Promise<ReportSnapshot[]> {
    const reports = await this.repo.findByEmergencyId(
      query.emergencyId,
      query.filters,
    );
    return reports.map((r) => r.toSnapshot());
  }
}
