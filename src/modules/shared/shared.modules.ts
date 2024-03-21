import { Global, Module } from '@nestjs/common';

import { RedLockService } from './redlock.service';

@Global()
@Module({
  providers: [RedLockService],
  exports: [RedLockService],
})
export class SharedModule {}
