import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TeacherAssignmentResponseDto } from './dto/teacher-response.dto';
import { ClassTeacher } from './entities/class-teacher.entity';
import { Class } from './entities/classes.entity';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
    @InjectRepository(ClassTeacher)
    private classTeacherRepository: Repository<ClassTeacher>,
  ) {}

  /**
   * Fetches teachers for a specific class and session.
   */
  async getTeachersByClass(
    classId: number,
    sessionId?: string,
  ): Promise<TeacherAssignmentResponseDto[]> {
    // 1. Validate Class Existence
    const class_exitst = await this.classRepository.findOne({
      where: { id: classId },
    });
    if (!class_exitst) {
      throw new NotFoundException(`Class with ID ${classId} not found`);
    }

    // 2. Handle Session Logic (Default to active if null)
    const target_session = sessionId || (await this.getActiveSession());

    // 3. Fetch Assignments with Relations
    // We join 'class' here to access the 'stream' property
    const assignments = await this.classTeacherRepository.find({
      where: {
        class: { id: classId },
        session_id: target_session,
        is_active: true,
      },
      relations: ['teacher', 'class'],
      select: {
        id: true,
        assignment_date: true,
        teacher: {
          id: true,
          name: true,
        },
        class: {
          id: true,
          stream: true,
        },
      },
    });

    // 4. Map to DTO
    return assignments.map((assignment) => ({
      teacher_id: assignment.teacher.id,
      name: assignment.teacher.name,
      assignment_date: assignment.assignment_date,
      stream: assignment.class.stream,
    }));
  }

  // Mock helper for active session
  private async getActiveSession(): Promise<string> {
    return '2024-2025';
  }
}
