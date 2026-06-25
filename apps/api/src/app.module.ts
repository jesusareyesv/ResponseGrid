import { Module } from '@nestjs/common';
import { ResourcesModule } from './contexts/resources/infrastructure/resources.module';
import { EmergenciesModule } from './contexts/emergencies/infrastructure/emergencies.module';
import { IdentityModule } from './contexts/identity/infrastructure/identity.module';
import { NeedsModule } from './contexts/needs/infrastructure/needs.module';

@Module({ imports: [IdentityModule, ResourcesModule, EmergenciesModule, NeedsModule] })
export class AppModule {}
