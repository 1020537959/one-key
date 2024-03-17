import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'nestjs-prisma';
import { InjectRedis } from '@nestjs-modules/ioredis';
import axios from "axios";
import { SearchEthBalanceDto } from './dto/search-eth-balance.dto';
import { Redis } from 'ioredis';
import { REDIS } from "../../common/constants";
import { URL } from 'url';
import { ConfigService } from '@nestjs/config';
import { AuthUser } from '../dto/auth-user.dto';
import { OnEvent } from '@nestjs/event-emitter';
import { HandleEthBalanceEventDto } from '../dto/eth-balance-event.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

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
   * 设置 ETH 余额缓存
   * @param address 用户地址
   * @param eth_balance ETH 余额
   */
  async _setEthBalanceCache(address: string, eth_balance: string) {
    const { ETH_BALANCE } = REDIS;
    const redisKey = `${ETH_BALANCE.PREFIX}${address}`;
    const min = -10;
    const max = 10;
    let randomExpire = Math.floor(Math.random() * (max - min + 1)) + min;
    const realExpire = ETH_BALANCE.EXPIRE + randomExpire;
    this.redis.setex(redisKey, realExpire, eth_balance)
    .catch(err => {
      console.error(`【${address}】设置余额缓存异常, ${err}`);
    });
  }

  async create(dto: CreateUserDto) {
    const { name } = dto;
    return this.prisma.user.create({ data: { name } });
  }

  async findOneById(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
  }

  /**
   * 根据用户地址查询余额信息 - V1
   * @description 引入缓存，减少对 ethGetBalance 访问
   * @param dto 查询余额Dto
   * @param user 授权用户信息
   */
  async searchEthBalanceV1(dto: SearchEthBalanceDto, user: AuthUser) {
    const { address } = dto;
    const value = await this._getEthBalanceCache(address);
    if (value) {
      return { eth_balance: value };
    }
    // 余额缓存不存在，到etherscan拉取
    let eth_balance = '0';
    try {
      const { data } = await this.ethGetBalance(address);
      // {status: "1", message: "OK", result: "310273759783183622481491"}
      if (data?.status === '1') {
        eth_balance = data?.result;
      }
      console.error(`【${address}】拉取etherscan余额失败, ${data?.message}`);
    } catch (err) {
      console.error(`【${address}】拉取etherscan余额异常, ${err}`);
    }
    if (eth_balance) {
      // 异步更新数据库余额
      this.prisma.userAddress.upsert({
        where: { address },
        update: { eth_balance },
        create: { user_id: user.id, address, eth_balance }
      }).catch(err => {
        console.error(`【${address}】更新数据库余额异常, ${err}`);
      });
    } else {
        // 获取数据库余额并返回
        try {
          const userAddress = await this.prisma.userAddress.findUnique({
            select: { eth_balance: true },
            where: { address }
          });
          if (!userAddress) {
            throw new HttpException('用户地址错误', HttpStatus.NOT_FOUND);
          }
          eth_balance = userAddress.eth_balance;
          // 设置缓存
          this._setEthBalanceCache(address, eth_balance)
            .catch(err => {
              console.error(`【${address}】设置余额缓存异常, ${err}`);
            });
        } catch (err) {
          console.error(`【${address}】获取数据库余额异常, ${err}`);
        }
      }
    return { eth_balance };
  }

  /**
   * 处理 ETH 余额变更事件
   * @param payload 变更内容
   */
  @OnEvent('eth_balance.*')
  async handleEthBalanceEvent(payload: HandleEthBalanceEventDto) {
    // 正常类似事件应该会有个解密，验签过程，这里省去
    console.log('接收到事件', payload);
    const { address, user_id, eth_balance } = payload;
    await this.prisma.userAddress.upsert({
      where: { address },
      update: { eth_balance },
      create: { address, user_id, eth_balance }
    });
    this._setEthBalanceCache(address, eth_balance)
      .catch(err => {
        console.error(`【${address}】设置余额缓存异常, ${err}`);
      })
  }

  async ethGetBalance(address: string) {
    const apikey: string = this.config.get('etherscan.apikey');
    const url = new URL('/api', 'https://api.etherscan.io');
    url.searchParams.append('module', 'account');
    url.searchParams.append('action', 'balance');
    url.searchParams.append('address', address);
    url.searchParams.append('tag', 'latest');
    url.searchParams.append('apikey', apikey);
    const result = await axios.get(url.href, {
      proxy: {
        // TODO 这里的代理配置有问题
        host: '51.143.187.127',
        port: 57750
      }
    });
    return result;
  }
}
