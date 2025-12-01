import { AcademicSession } from '../entities';

export interface IPaginationMeta {
  total: number;
  summary?: {
    active: number;
    inactive: number;
    archived: number;
  };
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface ICreateSessionResponse {
  status_code: number;
  message: string;
  data: AcademicSession;
}

export interface IGetAllSessionsResponse {
  status_code: number;
  message: string;
  data: AcademicSession[];
  meta: IPaginationMeta;
}

export interface IGetSessionByIdResponse {
  status_code: number;
  message: string;
  data: AcademicSession;
}

export interface IUpdateSessionResponse {
  status_code: number;
  message: string;
  data: AcademicSession;
}

export interface IDeleteSessionResponse {
  status_code: number;
  message: string;
  data: AcademicSession;
}
