import { ReportRepository } from '../domain/ports/report.repository';
import { ReportNotFoundError } from '../domain/report-errors';

export interface MarkReportReviewedCommand {
  reportId: string;
}

export class MarkReportReviewed {
  constructor(private readonly repo: ReportRepository) {}

  async execute(cmd: MarkReportReviewedCommand): Promise<void> {
    const report = await this.repo.findById(cmd.reportId);
    if (!report) {
      throw new ReportNotFoundError(cmd.reportId);
    }
    report.markReviewed();
    await this.repo.save(report);
  }
}
