import { Global, Module } from '@nestjs/common';
import { R2StorageService } from './r2.storage';

@Global()
@Module({
  providers: [
    {
      provide: 'STORAGE_SERVICE',
      useClass: R2StorageService,
    },
  ],
  exports: ['STORAGE_SERVICE'],
})
export class StorageModule {}
