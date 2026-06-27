import { Module } from '@nestjs/common';
import { DB, DatabaseModule } from '../../../shared/database.module';
import { Db } from '../../../shared/db';
import { MetricsController } from './http/metrics.controller';
import { GetEmergencyMetrics } from '../application/get-emergency-metrics';
import { METRICS_READER, MetricsReader } from '../domain/ports/metrics-reader';
import { DrizzleMetricsReader } from './drizzle/drizzle-metrics-reader';

const metricsReaderProvider = {
  provide: METRICS_READER,
  inject: [DB],
  useFactory: (db: Db): MetricsReader => new DrizzleMetricsReader(db),
};

const getEmergencyMetricsProvider = {
  provide: GetEmergencyMetrics,
  inject: [METRICS_READER],
  useFactory: (metricsReader: MetricsReader) =>
    new GetEmergencyMetrics(metricsReader),
};

@Module({
  imports: [DatabaseModule],
  controllers: [MetricsController],
  providers: [metricsReaderProvider, getEmergencyMetricsProvider],
})
export class MetricsModule {}
