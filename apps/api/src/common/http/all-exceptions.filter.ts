import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { randomUUID } from "crypto";

type RequestWithId = Request & {
  requestId?: string;
};

@Catch()
export class AllExceptionsFilter
  implements ExceptionFilter
{
  private readonly logger = new Logger(
    AllExceptionsFilter.name,
  );

  catch(
    exception: unknown,
    host: ArgumentsHost,
  ): void {
    const ctx = host.switchToHttp();

    const request =
      ctx.getRequest<RequestWithId>();

    const response =
      ctx.getResponse<Response>();

    const requestId =
      request.requestId ?? randomUUID();

    const timestamp =
      new Date().toISOString();

    const path = request.path;

    let statusCode =
      HttpStatus.INTERNAL_SERVER_ERROR;

    let message:
      | string
      | string[] =
      "INTERNAL_SERVER_ERROR";

    if (exception instanceof HttpException) {
      statusCode =
        exception.getStatus();

      const exceptionResponse =
        exception.getResponse();

      if (
        typeof exceptionResponse === "string"
      ) {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === "object" &&
        exceptionResponse !== null
      ) {
        const responseMessage =
          (
            exceptionResponse as {
              message?: string | string[];
            }
          ).message;

        if (responseMessage) {
          message = responseMessage;
        }
      }
    }

    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${path} ${statusCode} requestId=${requestId}`,
        exception instanceof Error
          ? exception.stack
          : String(exception),
      );
    } else {
      this.logger.warn(
        `${request.method} ${path} ${statusCode} requestId=${requestId} message=${JSON.stringify(message)}`,
      );
    }

    response.status(statusCode).json({
      statusCode,
      message,
      path,
      timestamp,
      requestId,
    });
  }
}