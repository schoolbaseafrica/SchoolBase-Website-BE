import { Repository, Like } from 'typeorm';

import { Teacher } from '../entities/teacher.entity';

/**
 * Generate a unique employment ID in the format EMP-YYYY-XXX
 * where YYYY is the current year and XXX is a sequential number (001, 002, etc.)
 */
export async function generateEmploymentId(
  teacherRepository: Repository<Teacher>,
): Promise<string> {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `EMP-${currentYear}-`;

  // Query the highest existing sequential number for the current year
  const lastTeacher = await teacherRepository.findOne({
    where: { employmentId: Like(`${yearPrefix}%`) },
    order: { employmentId: 'DESC' },
  });

  let nextSequence = 1;
  if (lastTeacher) {
    // Extract the numeric part (e.g., '014' from 'EMP-2025-014')
    const parts = lastTeacher.employmentId.split('-');
    if (parts.length === 3) {
      const lastId = parts[2];
      nextSequence = parseInt(lastId, 10) + 1;
    }
  }

  // Format the sequence number to be 3 digits (e.g., 1 -> 001, 14 -> 014)
  const sequenceStr = nextSequence.toString().padStart(3, '0');
  return `${yearPrefix}${sequenceStr}`;
}
