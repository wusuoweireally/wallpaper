import {
  Catch,
  ArgumentsHost,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { MulterError } from "multer";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const isMulterError = exception instanceof MulterError;
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    if (isHttpException) {
      status = exception.getStatus();
    } else if (isMulterError) {
      status =
        exception.code === "LIMIT_FILE_SIZE"
          ? HttpStatus.PAYLOAD_TOO_LARGE
          : HttpStatus.BAD_REQUEST;
    }

    let message = isMulterError
      ? exception.code === "LIMIT_FILE_SIZE"
        ? "上传文件过大"
        : "上传文件不符合要求"
      : "服务器错误，请稍后重试";

    if (isHttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
      } else if (exceptionResponse && typeof exceptionResponse === "object") {
        const responseMessage = (
          exceptionResponse as { message?: string | string[] }
        ).message;
        if (Array.isArray(responseMessage)) {
          message = responseMessage.join("，");
        } else if (responseMessage) {
          message = responseMessage;
        }
      }
    }

    response.status(status).json({
      success: false,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
