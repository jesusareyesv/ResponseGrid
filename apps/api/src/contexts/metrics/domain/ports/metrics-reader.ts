import { NeedStatus } from '../../../needs/domain/need-enums';
import { PublicStatus } from '../../../resources/domain/resource-enums';

export const METRICS_READER = Symbol('MetricsReader');

/**
 * Read-only port that provides the aggregated counts the metrics use case needs.
 *
 * Decouples the metrics context from the full NeedRepository and ResourceRepository
 * ports of the needs/resources contexts. The adapter (DrizzleMetricsReader) queries
 * the underlying tables directly using only the subset of data required for counting.
 */
export interface MetricsReader {
  countNeedsByEmergencyGroupedByStatus(
    emergencyId: string,
  ): Promise<Record<NeedStatus, number>>;

  countResourcesByEmergencyGroupedByPublicStatus(
    emergencyId: string,
  ): Promise<Record<PublicStatus, number>>;
}
