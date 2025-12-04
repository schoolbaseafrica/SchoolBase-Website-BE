export interface IStudentGradeData {
  subject_id: string;
  subject_name: string;
  ca_score: number | null;
  exam_score: number | null;
  total_score: number | null;
  grade_letter: string | null;
  comment: string | null;
}

export interface IStudentResultData {
  student_id: string;
  class_id: string;
  grades: IStudentGradeData[];
  total_score: number;
  average_score: number;
  subject_count: number;
  position?: number;
}
