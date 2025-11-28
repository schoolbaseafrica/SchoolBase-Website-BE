export interface IPaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages?: number;
  has_next?: boolean;
  has_previous?: boolean;
}

export interface ICreateClassResponse {
  message: string;
  id: string;
  name: string;
  arm?: string;
  academicSession: {
    id: string;
    name: string;
  };
}

export interface IUpdateClassResponse {
  message: string;
  id: string;
  name: string;
  arm?: string;
  academicSession: {
    id: string;
    name: string;
  };
}

export interface IGetClassByIdResponse {
  message: string;
  id: string;
  name: string;
  arm?: string;
  academicSession: {
    id: string;
    name: string;
  };
}
