export interface IMarkAttendanceResponse {
  message: string;
  status_code: number;
  data: {
    marked: number;
    updated: number;
    total: number;
  };
}

export interface IUpdateAttendanceResponse {
  message: string;
  status_code: number;
}

export interface IAttendanceMarkedCheckResponse {
  is_marked: boolean;
  count: number;
}

export interface IStudentTermAttendanceSummary {
  message: string;
  status_code: number;
  data: {
    total_school_days: number;
    days_present: number;
    days_absent: number;
  };
}
