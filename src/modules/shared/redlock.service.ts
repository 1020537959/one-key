import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import RedLock from 'redlock';
import { REDIS } from 'src/common/constants';

@Injectable()
export class RedLockService {
  private readonly redlock: RedLock;
  constructor(@InjectRedis() private readonly redis: Redis) {
    this.redlock = new RedLock([redis]);
  }

  async lockAddress(address: string) {
    const { ADDRESS_LOCK } = REDIS;
    const key = `${ADDRESS_LOCK.PREFIX}${address}`;
    return this.redlock.acquire([key], ADDRESS_LOCK.EXPIRE * 1000);
  }
}
