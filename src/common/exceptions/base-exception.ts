import { HttpStatus, HttpException } from "@nestjs/common";

export class BaseException extends HttpException {
    constructor(
        message: string, 
        statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
        public readonly error?: any
    ){
        super (
            {
                statusCode,
                message,
                error: error?.message || null,
            },
            statusCode,
            {cause: error}
        );
    }
}