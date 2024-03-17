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
import Decimal from 'decimal.js';
import { AuthUser } from '../dto/auth-user.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async create(dto: CreateUserDto) {
    const { name } = dto;
    return this.prisma.user.create({ data: { name } });
  }

  async findOneById(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
  }

  async searchEthBalance(dto: SearchEthBalanceDto, user: AuthUser) {
    const { address } = dto;
    // 引入缓存
    const { ETH_BALANCE } = REDIS;
    const redisKey = `${ETH_BALANCE}${address}`;
    const value = await this.redis.get(redisKey);
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
      console.error(`用户地址 ${address} 拉取etherscan余额失败, ${data?.message}`);
    } catch (err) {
      console.error(`用户地址 ${address} 拉取etherscan余额异常, ${err}`);
    }
    if (eth_balance) {
      // 异步更新数据库余额
      this.prisma.userAddress.upsert({
        where: { address },
        update: { eth_balance },
        create: { user_id: user.id, address, eth_balance }
      }).catch(err => {
        console.error(`用户地址 ${address} 更新数据库余额异常, ${err}`);
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
        } catch (err) {
          console.error(`用户地址 ${address} 获取数据库余额异常, ${err}`);
        }
      }
    return { eth_balance };
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
        host: 'uhisfgy78eu.cfprefer1.xyz',
        port: 14149
      }
    });
    return result;
  }
}
