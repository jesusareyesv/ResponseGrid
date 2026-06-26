import * as path from 'node:path';
import { Module } from '@nestjs/common';
import { IdentityModule } from '../../identity/infrastructure/identity.module';
import { FILE_STORAGE, FileStorage } from '../domain/ports/file-storage';
import { LocalDiskFileStorage } from './local-disk-file-storage';
import { FilesController } from './files.controller';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

const fileStorageProvider = {
  provide: FILE_STORAGE,
  useFactory: (): FileStorage => new LocalDiskFileStorage(UPLOADS_DIR),
};

@Module({
  imports: [IdentityModule],
  controllers: [FilesController],
  providers: [fileStorageProvider],
  exports: [FILE_STORAGE],
})
export class FilesModule {}
