import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RedisModule } from '@nestjs-modules/ioredis';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from 'nestjs-prisma';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/index';
import { SharedModule } from './modules/shared/shared.modules';
import { userUserModule } from './modules/user-address/user-address.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      load: [configuration],
      isGlobal: true,
    }),
    PrismaModule.forRootAsync({
      isGlobal: true,
      useFactory: async (configService: ConfigService) => {
        const username = configService.get('db.mysql.username');
        const password = configService.get('db.mysql.password');
        const host = configService.get('db.mysql.host');
        const port = configService.get('db.mysql.port');
        const database = configService.get('db.mysql.database');
        return {
          prismaOptions: {
            datasources: {
              db: {
                url: `mysql://${username}:${password}@${host}:${port}/${database}?connection_limit=15`,
              },
            },
          },
        };
      },
      inject: [ConfigService],
    }),
    RedisModule.forRootAsync({
      useFactory: async (configService: ConfigService) => {
        return {
          type: 'single',
          config: {
            url: `redis://:${configService.get(
              'redis.serviceCenter.password',
            )}@${configService.get(
              'redis.serviceCenter.host',
            )}:${configService.get(
              'redis.serviceCenter.port',
            )}/${configService.get('redis.serviceCenter.db')}`,
          },
        };
      },
      inject: [ConfigService],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        formatters: {
          level: (label) => {
            return { level: label };
          },
        },
        level: process.env.NODE_ENV !== 'prod' ? 'debug' : 'info', // 正式环境使用info等级，测试环境使用debug等级
        autoLogging: false, // 关闭自动req、res日志，如果开启，将对请求和响应进行日志记录
        quietReqLogger: true,
        transport:
          process.env.NODE_ENV !== 'prod'
            ? { target: 'pino-pretty' }
            : undefined, // 正式环境开启 json格式输出，非正式环境pretty输出
      },
    }),
    SharedModule,
    EventEmitterModule.forRoot({ wildcard: true }),
    userUserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
