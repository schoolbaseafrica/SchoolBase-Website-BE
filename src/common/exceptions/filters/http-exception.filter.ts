import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status = exception.getStatus ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

        const rawResponse = exception.getResponse();

        const exceptionResponse = typeof rawResponse === "string" ? {message: rawResponse} : (rawResponse as object);

        response.status(status).json({
            ...exceptionResponse,
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
}