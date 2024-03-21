import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import Web3 from 'web3';

import { AppService } from './app.service';
import { EthBalanceEventDto } from './modules/dto/eth-balance-event.dto';

@ApiTags('默认')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly logger: Logger,
  ) {}

  @Get('health')
  health(): string {
    return this.appService.health();
  }

  @ApiOperation({ summary: '模拟ETH 余额变更事件' })
  @Get('v1/event')
  async simulateEvent(@Query() dto: EthBalanceEventDto) {
    const { from, to, eth } = dto;
    const web3 = new Web3(
      new Web3.providers.HttpProvider('http://127.0.0.1:7545'),
    );
    // 发送一个交易
    const result = await web3.eth.sendTransaction({
      from,
      to,
      value: web3.utils.toWei(eth, 'ether'),
    });
    this.logger.debug('发送交易结果', result);
  }
}
