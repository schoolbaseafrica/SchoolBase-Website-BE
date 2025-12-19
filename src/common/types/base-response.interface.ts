import { HttpStatus } from '@nestjs/common';

export interface IPaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface IBaseResponse<T> {
  status_code: HttpStatus;
  message: string;
  data: T;
}
