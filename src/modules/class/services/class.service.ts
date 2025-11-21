import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

import { TeacherAssignmentResponseDto } from '../dto/teacher-response.dto';
import { ClassTeacherModelAction } from '../model-actions/class-teacher.action';
import { ClassModelAction } from '../model-actions/class.actions';

@Injectable()
export class ClassService {
  private readonly logger: Logger;
  constructor(
    private readonly classModelAction: ClassModelAction,
    private readonly classTeacherModelAction: ClassTeacherModelAction,
    @Inject(WINSTON_MODULE_PROVIDER) baseLogger: Logger,
  ) {
    this.logger = baseLogger.child({ context: ClassService.name });
  }

  /**
   * Fetches teachers for a specific class and session.
   */
  async getTeachersByClass(
    classId: string,
    sessionId?: string,
  ): Promise<TeacherAssignmentResponseDto[]> {
    const classExist = await this.classModelAction.get({
      identifierOptions: { id: classId },
    });

    if (!classExist) {
      throw new NotFoundException(`Class with ID ${classId} not found`);
    }

    // 2. Handle Session Logic (Default to active if null)
    const target_session = sessionId || (await this.getActiveSession());

    // 3. Fetch Assignments with Relations
    // We join 'class' here to access the 'stream' property
    const assignments = await this.classTeacherModelAction.list({
      filterRecordOptions: {
        class: { id: classId },
        session_id: target_session,
        is_active: true,
      },
      relations: {
        teacher: { user: true },
        class: true,
      },
    });

    // 4. Map to DTO
    return assignments.payload.map((assignment) => ({
      teacher_id: assignment.teacher.id,
      name: assignment.teacher.user
        ? `${assignment.teacher.user.first_name} ${assignment.teacher.user.last_name}`
        : `Teacher ${assignment.teacher.employment_id}`,
      assignment_date: assignment.assignment_date,
      stream: assignment.class.stream,
    }));
  }

  // Mock helper for active session
  private async getActiveSession(): Promise<string> {
    return '2024-2025';
  }
}
