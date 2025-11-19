import { HttpStatus } from '@nestjs/common';

export interface IBaseResponse<T> {
  status_code: HttpStatus;
  message: string;
  data: T;
}
