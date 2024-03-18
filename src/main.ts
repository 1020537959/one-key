import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/interception';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { logLevel } from 'kafkajs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService)

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

  app.startAllMicroservices().catch((err) => {
    console.error(
      `微服务启动失败：${err}。kafka配置：${JSON.stringify(kafkaConfig)}`,
    );
  });

  await app.listen(3000);
}
bootstrap();
