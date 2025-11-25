import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';

import { Student } from '../entities';

@Injectable()
export class StudentModelAction extends AbstractModelAction<Student> {
  constructor(
    @InjectRepository(Student)
    studentRepository: Repository<Student>,
  ) {
    super(studentRepository, Student);
  }

  /**
   * Generate a unique Registration Number in the format REG-YYYY-XXX
   * where YYYY is the current year and XXX is a sequential number (001, 002, etc.)
   */
  async generateRegistrationNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const yearPrefix = `REG-${currentYear}-`;

    // Query the highest existing sequential number for the current year
    const lastStudent = await this.repository.findOne({
      where: { registration_number: Like(`${yearPrefix}%`) },
      order: { registration_number: 'DESC' },
    });

    let nextSequence = 1;
    if (lastStudent) {
      // Extract the numeric part (e.g., '014' from 'REG-2025-014')
      const parts = lastStudent.registration_number.split('-');
      if (parts.length === 3) {
        const lastId = parts[2];
        nextSequence = parseInt(lastId, 10) + 1;
      }
    }

    // Format the sequence number to be 3 digits (e.g., 1 -> 001, 14 -> 014)
    const sequenceStr = nextSequence.toString().padStart(3, '0');
    return `${yearPrefix}${sequenceStr}`;
  }
}
