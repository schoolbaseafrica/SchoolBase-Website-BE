/**
 * Grading Utility
 *
 * Provides utilities for calculating grades, remarks, and other grading-related operations.
 * Uses the same grading scale as the grade module:
 * A (80-100), B (70-79), C (60-69), D (50-59), E (40-49), F (0-39)
 */

import { UserRole } from 'src/modules/shared/enums';

export interface IGradingScale {
  min: number;
  max: number;
  grade: string;
  remark: string;
}

export interface IRequestWithUser extends Request {
  user: {
    id: string;
    userId: string;
    teacher_id?: string;
    student_id?: string;
    parent_id?: string;
    roles: UserRole[];
  };
}

export const GRADING_SCALE: IGradingScale[] = [
  { min: 80, max: 100, grade: 'A', remark: 'Excellent' },
  { min: 70, max: 79, grade: 'B', remark: 'Very Good' },
  { min: 60, max: 69, grade: 'C', remark: 'Good' },
  { min: 50, max: 59, grade: 'D', remark: 'Fair' },
  { min: 40, max: 49, grade: 'E', remark: 'Poor' },
  { min: 0, max: 39, grade: 'F', remark: 'Fail' },
];

/**
 * Calculate grade letter based on total score
 */
export function calculateGradeLetter(totalScore: number | null): string | null {
  if (totalScore === null || totalScore < 0) {
    return null;
  }

  for (const scale of GRADING_SCALE) {
    if (totalScore >= scale.min && totalScore <= scale.max) {
      return scale.grade;
    }
  }

  return 'F';
}

/**
 * Get remark based on total score
 */
export function getRemark(totalScore: number | null): string | null {
  if (totalScore === null || totalScore < 0) {
    return null;
  }

  for (const scale of GRADING_SCALE) {
    if (totalScore >= scale.min && totalScore <= scale.max) {
      return scale.remark;
    }
  }

  return GRADING_SCALE[GRADING_SCALE.length - 1].remark; // 'Fail'
}

/**
 * Get overall remark based on average score
 */
export function getOverallRemark(averageScore: number | null): string {
  if (averageScore === null || averageScore < 0) {
    return 'No grades available';
  }

  const remark = getRemark(averageScore);
  return remark || 'No grades available';
}
