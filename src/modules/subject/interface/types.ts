export interface IBaseResponse<T> {
  message: string;
  data: T;
}

export interface IPaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages?: number;
  has_next?: boolean;
  has_previous?: boolean;
}

export interface IPaginatedResponse<T> {
  message: string;
  data: T[];
  pagination: IPaginationMeta;
}

export interface IAssignClassesToSubjectResponse {
  message: string;
  id: string;
  subjectId: string;
  name: string;
  classes: {
    id: string;
    name: string;
    arm: string;
    academicSession: {
      id: string;
      name: string;
    };
  }[];
}
