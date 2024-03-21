import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { Logger } from 'nestjs-pino';
import { PrismaService } from 'nestjs-prisma';
import Web3 from 'web3';

import { REDIS } from '../../common/constants';
import { HandleEthBalanceEventDto } from '../dto/eth-balance-event.dto';
import { SearchEthBalanceDto } from './dto/search-eth-balance.dto';

@Injectable()
export class UserAddressService {
  web3: Web3;

  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
    private readonly logger: Logger,
    private readonly config: ConfigService,
  ) {
    const { host, port } = this.config.get('etherscan');
    this.web3 = new Web3(
      new Web3.providers.HttpProvider(`http://${host}:${port}`),
    );
  }

  get _selectAttributes() {
    return { id: true, address: true, user_id: true, eth_balance: true };
  }

  /**
   * 获取 ETH 余额缓存
   * @param address 用户地址
   */
  async _getEthBalanceCache(address: string) {
    const { ETH_BALANCE } = REDIS;
    const redisKey = `${ETH_BALANCE.PREFIX}${address}`;
    return this.redis.get(redisKey);
  }

  /**
   * 设置 ETH 余额缓存（20-40秒随机过期时间）
   * @param address 用户地址
   * @param eth_balance ETH 余额
   */
  async _setEthBalanceCache(address: string, eth_balance: string) {
    const { ETH_BALANCE } = REDIS;
    const redisKey = `${ETH_BALANCE.PREFIX}${address}`;
    const min = -10;
    const max = 10;
    const randomExpire = Math.floor(Math.random() * (max - min + 1)) + min;
    const realExpire = ETH_BALANCE.EXPIRE + randomExpire;
    this.redis.setex(redisKey, realExpire, eth_balance).catch((err) => {
      this.logger.error(`【${address}】设置余额缓存异常, ${err}`);
    });
  }

  /**
   * 详情
   * @param address 用户地址
   * @param options 可选项
   */
  async findOneByQuery(
    address: string,
    options?: { select: { eth_balance: boolean } },
  ) {
    const { select = this._selectAttributes } = options || {};
    const userAddress = await this.prisma.userAddress.findUnique({
      select,
      where: { address },
    });
    if (!userAddress)
      throw new HttpException('用户地址不存在', HttpStatus.NOT_FOUND);
    return userAddress;
  }

  /**
   * 根据用户地址查询余额信息 - V1
   * @description 引入缓存，减少对 ethGetBalance 访问
   * @param dto 查询余额Dto
   */
  async searchEthBalanceV1(dto: SearchEthBalanceDto) {
    const { address } = dto;
    let eth_balance;
    eth_balance = await this._getEthBalanceCache(address);
    // 余额缓存不存在，到etherscan拉取
    if (!eth_balance) {
      try {
        eth_balance = await this.ethGetBalance(address);
      } catch (err) {
        this.logger.error(`【${address}】拉取etherscan余额异常, ${err}`);
      }
      if (eth_balance) {
        // 异步更新数据库余额
        this.prisma.userAddress
          .upsert({
            where: { address },
            update: { eth_balance },
            create: { address, eth_balance },
          })
          .catch((err) => {
            this.logger.error(`【${address}】更新数据库余额异常, ${err}`);
          });
      } else {
        // 获取数据库余额并返回
        try {
          const userAddress = await this.findOneByQuery(address, {
            select: { eth_balance: true },
          });
          eth_balance = userAddress.eth_balance;
          // 设置缓存
          this._setEthBalanceCache(address, eth_balance).catch((err) => {
            this.logger.error(`【${address}】设置余额缓存异常, ${err}`);
          });
        } catch (err) {
          this.logger.error(`【${address}】获取数据库余额异常, ${err}`);
        }
      }
    }
    return { eth_balance };
  }

  /**
   * 处理 ETH 余额变更事件
   * @param payload 变更内容
   */
  @OnEvent('pendingTransactions')
  async handleEthBalanceEvent(payload: HandleEthBalanceEventDto) {
    this.logger.debug('【pendingTransactions】', payload);
    const { transactionHash } = payload;
    const timerId = setInterval(async () => {
      const transaction =
        await this.web3.eth.getTransactionReceipt(transactionHash);
      if (!transaction) return;
      this.logger.debug('【transaction】', transaction);
      const { from, to } = transaction;
      const [fromEthBalance, toEthBalance] = await Promise.all([
        this.ethGetBalance(from),
        // TODO to不一定是用户地址
        this.ethGetBalance(to),
      ]);
      await this.prisma.$transaction(async (prisma) => {
        await prisma.userAddress.upsert({
          where: { address: from },
          update: { eth_balance: fromEthBalance },
          create: { address: from, eth_balance: fromEthBalance },
        });
        await prisma.userAddress.upsert({
          where: { address: to },
          update: { eth_balance: toEthBalance },
          create: { address: to, eth_balance: toEthBalance },
        });
      });
      this._setEthBalanceCache(from, fromEthBalance).catch((err) => {
        this.logger.error(`【${from}】设置余额缓存异常, ${err}`);
      });
      this._setEthBalanceCache(to, toEthBalance).catch((err) => {
        this.logger.error(`【${to}】设置余额缓存异常, ${err}`);
      });
      // 交易完成时清除定时器
      if (transaction) {
        clearInterval(timerId);
      }
    }, 10);
  }

  /**
   * 获取用户地址余额
   * @param address 用户地址
   */
  async ethGetBalance(address: string): Promise<string> {
    const eth_balance = await this.web3.eth.getBalance(address);
    return String(eth_balance);
  }
}
