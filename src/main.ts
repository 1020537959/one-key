import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { logLevel } from 'kafkajs';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interception';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      enableDebugMessages: true, // 开发环境
      disableErrorMessages: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  // kafka
  const kafkaConfig = config.get('kafka');
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: [kafkaConfig.url],
        clientId: 'user-address-consumer',
        logLevel: logLevel.WARN,
      },
      consumer: {
        groupId: 'user-address-group',
      },
    },
  });
  // 日志
  const logger = app.get(Logger);
  app.useLogger(logger);

  app.startAllMicroservices().catch((err) => {
    this.logger.error(
      `微服务启动失败：${err}。kafka配置：${JSON.stringify(kafkaConfig)}`,
    );
  });

  await app.listen(3000);
}
bootstrap();
