import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PinoLogger } from 'nestjs-pino';
import Web3 from 'web3';

@Injectable()
export class BlockchainService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: PinoLogger,
  ) {
    this.init();
  }

  async init() {
    // 订阅区块链上更新事件
    const web3 = new Web3(
      new Web3.providers.WebsocketProvider('ws://127.0.0.1:7545'),
    );
    const subscription = await web3.eth.subscribe('pendingTransactions');
    subscription.on('data', (transactionHash) => {
      this.eventEmitter.emit(`pendingTransactions`, { transactionHash });
    });
    subscription.on('error', (error) => {
      this.logger.error('Subscription error:', error);
    });
  }
}
