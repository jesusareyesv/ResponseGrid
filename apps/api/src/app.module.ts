import { Module } from '@nestjs/common';
import { ResourcesModule } from './contexts/resources/infrastructure/resources.module';

@Module({ imports: [ResourcesModule] })
export class AppModule {}
