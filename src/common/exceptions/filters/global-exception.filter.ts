import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { BaseException } from "../base-exception";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status: number;
        let message: string | string[];
        let error: string | null = null;
        let stack: string | undefined;
        const isDevelopment = process.env.NODE_ENV !== "production";

        // Handle HttpException and its subclasses (including BaseException)
        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === "string") {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === "object") {
                const responseObj = exceptionResponse as any;
                message = responseObj.message || "An error occurred";
                error = responseObj.error || null;
            } else {
                message = "An error occurred";
            }

            // Log BaseException with additional context
            if (exception instanceof BaseException) {
                const logLevel = status >= 500 ? "error" : "warn";
                this.logger[logLevel](
                    `BaseException: ${Array.isArray(message) ? message.join(", ") : message}`,
                    {
                        statusCode: status,
                        path: request.url,
                        method: request.method,
                        userId: (request as any).user?.id || "anonymous",
                        error: exception.error,
                    }
                );
            } else {
                // Log other HttpExceptions
                const logLevel = status >= 500 ? "error" : "warn";
                this.logger[logLevel](
                    `HttpException: ${Array.isArray(message) ? message.join(", ") : message}`,
                    {
                        statusCode: status,
                        path: request.url,
                        method: request.method,
                    }
                );
            }
        }
        // Handle validation errors (class-validator)
        else if (
            exception &&
            typeof exception === "object" &&
            "response" in exception &&
            "status" in exception
        ) {
            const validationError = exception as any;
            status = validationError.status || HttpStatus.BAD_REQUEST;
            message = validationError.response?.message || "Validation failed";
            error = validationError.response?.error || "Validation Error";

            this.logger.warn(`Validation Error: ${Array.isArray(message) ? message.join(", ") : message}`, {
                path: request.url,
                method: request.method,
            });
        }
        // Handle database errors (TypeORM, Prisma, etc.)
        else if (exception && typeof exception === "object" && "code" in exception) {
            const dbError = exception as any;
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            message = "Database operation failed";
            error = dbError.code || "DATABASE_ERROR";

            this.logger.error(
                `Database Error: ${dbError.message || "Unknown database error"}`,
                dbError.stack,
                {
                    code: dbError.code,
                    path: request.url,
                    method: request.method,
                }
            );

            if (isDevelopment && dbError.stack) {
                stack = dbError.stack;
            }
        }
        // Handle unknown errors
        else {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            message = "Internal server error";
            error = "INTERNAL_SERVER_ERROR";

            const errorMessage = exception instanceof Error ? exception.message : "Unknown error";
            const errorStack = exception instanceof Error ? exception.stack : undefined;

            // Log full error details
            this.logger.error(
                `Unhandled Exception: ${errorMessage}`,
                errorStack,
                {
                    path: request.url,
                    method: request.method,
                    userId: (request as any).user?.id || "anonymous",
                }
            );

            if (isDevelopment && errorStack) {
                stack = errorStack;
            }
        }

        // Normalize message to array format for consistency
        const normalizedMessage = Array.isArray(message) ? message : [message];

        const errorResponse: any = {
            statusCode: status,
            message: normalizedMessage,
            error: error,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
        };

        // Only include stack trace in development
        if (isDevelopment && stack) {
            errorResponse.stack = stack;
        }

        // Sanitize response in production for security
        if (!isDevelopment && status >= 500) {
            // In production, don't expose internal error details
            errorResponse.message = ["An internal server error occurred"];
            errorResponse.error = "Internal Server Error";
        }

        response.status(status).json(errorResponse);
    }
}

