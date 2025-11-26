import { ClassResponseDto } from '../dto/create-class.dto';

export interface IPaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages?: number;
  has_next?: boolean;
  has_previous?: boolean;
}

export interface ICreateClassResponse {
  status_code: number;
  message: string;
  data: ClassResponseDto;
}
