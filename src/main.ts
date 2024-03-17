import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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


  await app.listen(3000);
}
bootstrap();
