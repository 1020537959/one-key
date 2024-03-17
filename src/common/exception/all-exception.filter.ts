import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    logger.setContext(AllExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = exception['message'];
    if (exception instanceof BadRequestException) {
      message = exception['response']['message'];
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
    } else if (exception['name'] === 'ApiError') {
      status = exception['status'];
      const body = exception['body'];
      if (body && body['msg']) {
        message = body['msg'];
      }
    }
    const logFormat = `AllExceptionsFilter:
      \\n <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
      Request original url: ${request.originalUrl}
      Method: ${request.method}
      IP: ${request.ip}
      Status code: ${status}
      Response: ${exception}
      \\n <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< `;
    this.logger.error(exception, logFormat);
    response.status(200).json({
      code: status,
      msg: `${message}`,
    });
  }
}
