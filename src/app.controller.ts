import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EthBalanceEventDto } from './modules/dto/eth-balance-event.dto';

// 模拟版本
let version = 1;

@ApiTags('默认')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Get('health')
  health(): string {
    return this.appService.health();
  }

  @ApiOperation({ summary: '模拟ETH 余额变更事件' })
  @Get('v1/event')
  async simulateEvent(@Query() dto: EthBalanceEventDto) {
    const { address, user_id, eth_balance } = dto;
    this.eventEmitter.emit(
      `eth_balance.${address}`,
      {
        address,
        // 正常可能不会带有用户ID
        user_id,
        eth_balance,
        timestamp: Date.now(),
        version: String(version++).padStart(8, '0'),
      }
    );
  }
}