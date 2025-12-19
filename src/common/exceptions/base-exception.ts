import { HttpStatus, HttpException } from '@nestjs/common';

export class BaseException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    public readonly error?: unknown,
  ) {
    super(
      {
        status_code: statusCode,
        message,
        error: (error instanceof Error ? error.message : null) || null,
        data: null,
      },
      statusCode,
      { cause: error },
    );
  }
}
