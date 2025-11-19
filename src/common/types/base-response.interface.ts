import { HttpStatus } from '@nestjs/common';

export interface BaseResponse<T> {
  status_code: HttpStatus;
  message: string;
  data: T;
}
