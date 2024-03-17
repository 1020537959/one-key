import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/index';
import { PrismaModule } from 'nestjs-prisma';

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
    UserModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
