import {
  ConflictException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { EntityManager } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../../constants/system.messages';
import { StudentModelAction } from '../../student/model-actions/student-actions';
import { ClassStudent } from '../entities/class-student.entity';
import { Class } from '../entities/class.entity';
import { ClassStudentModelAction } from '../model-actions/class-student.action';
import { ClassModelAction } from '../model-actions/class.actions';

@Injectable()
export class ClassStudentValidationService {
  private readonly logger: Logger;

  constructor(
    private readonly classModelAction: ClassModelAction,
    @Inject(forwardRef(() => StudentModelAction))
    private readonly studentModelAction: StudentModelAction,
    private readonly classStudentModelAction: ClassStudentModelAction,
    @Inject(WINSTON_MODULE_PROVIDER) logger: Logger,
  ) {
    this.logger = logger.child({
      context: ClassStudentValidationService.name,
    });
  }

  /**
   * Validates all rules for assigning a single student to a class
   * @param classId - The class ID
   * @param studentId - The student ID
   * @param sessionId - The academic session ID
   * @param manager - Optional transaction manager for atomic validation
   */
  async validateStudentAssignment(
    classId: string,
    studentId: string,
    sessionId: string,
    manager?: EntityManager,
  ): Promise<void> {
    // 1. Validate class exists and is not deleted
    await this.validateClassExists(classId);

    // 2. Validate student exists and is not deleted
    await this.validateStudentExists(studentId);

    // 3. Validate student is not already in another class (same session)
    await this.validateStudentNotInAnotherClass(
      studentId,
      classId,
      sessionId,
      manager,
    );
  }

  /**
   * Validates all rules for batch student assignment
   * @param classId - The class ID
   * @param studentIds - Array of student IDs
   * @param sessionId - The academic session ID
   * @param manager - Optional transaction manager for atomic validation
   */
  async validateBatchStudentAssignment(
    classId: string,
    studentIds: string[],
    sessionId: string,
    manager?: EntityManager,
  ): Promise<void> {
    // 1. Validate class exists and is not deleted
    await this.validateClassExists(classId);

    // 2. Remove duplicates
    const uniqueStudentIds = [...new Set(studentIds)];
    if (uniqueStudentIds.length !== studentIds.length) {
      this.logger.warn(
        `Duplicate student IDs detected. Original: ${studentIds.length}, Unique: ${uniqueStudentIds.length}`,
        { classId, studentIds },
      );
    }

    // 3. Validate all students exist and are not deleted
    for (const studentId of uniqueStudentIds) {
      try {
        await this.validateStudentExists(studentId);
      } catch (error) {
        if (error instanceof NotFoundException) {
          // Check if message already has batch prefix
          const errorMessage = error.message;
          if (errorMessage.startsWith('Cannot assign students:')) {
            throw error;
          }
          throw new NotFoundException(
            `Cannot assign students: Student with ID ${studentId} not found.`,
          );
        }
        throw error;
      }
    }

    // 4. Validate no student is in another class (same session)
    for (const studentId of uniqueStudentIds) {
      try {
        await this.validateStudentNotInAnotherClass(
          studentId,
          classId,
          sessionId,
          manager,
        );
      } catch (error) {
        if (error instanceof ConflictException) {
          // Re-throw with batch context prefix only if not already present
          const errorMessage = error.message;
          if (errorMessage.startsWith('Cannot assign students:')) {
            // Already has batch prefix, use as-is
            throw error;
          } else if (errorMessage.startsWith('Cannot assign student:')) {
            // Has single prefix, replace with batch prefix
            throw new ConflictException(
              `Cannot assign students: ${errorMessage.replace('Cannot assign student:', '').trim()}`,
            );
          } else {
            // No prefix, add batch prefix
            throw new ConflictException(
              `Cannot assign students: ${errorMessage}`,
            );
          }
        }
        throw error;
      }
    }
  }

  /**
   * Validates that a class exists and is not soft-deleted
   * Returns the class entity if valid
   */
  async validateClassExists(classId: string): Promise<Class> {
    const classEntity = await this.classModelAction.get({
      identifierOptions: { id: classId },
      relations: { academicSession: true },
    });

    if (!classEntity || classEntity.is_deleted) {
      this.logger.warn('Class not found or deleted', { classId });
      throw new NotFoundException(sysMsg.CLASS_NOT_FOUND);
    }

    return classEntity;
  }

  /**
   * Validates that a student exists and is not soft-deleted
   */
  async validateStudentExists(studentId: string): Promise<void> {
    const student = await this.studentModelAction.get({
      identifierOptions: { id: studentId },
    });

    if (!student || student.is_deleted) {
      this.logger.warn('Student not found or deleted', { studentId });
      throw new NotFoundException(`Student with ID ${studentId} not found.`);
    }
  }

  /**
   * Validates that a student is not already assigned to a different class in the same session
   * @param studentId - The student ID
   * @param targetClassId - The class we want to assign the student to
   * @param sessionId - The academic session ID
   * @param manager - Optional transaction manager
   */
  async validateStudentNotInAnotherClass(
    studentId: string,
    targetClassId: string,
    sessionId: string,
    manager?: EntityManager,
  ): Promise<void> {
    // Check if student has any active assignment in this session
    let existingAssignment: ClassStudent | null = null;

    if (manager) {
      // Use transaction manager
      existingAssignment = await manager.findOne(ClassStudent, {
        where: {
          student: { id: studentId },
          session_id: sessionId,
          is_active: true,
        },
        relations: ['class'],
      });
    } else {
      // Use model action
      const result = await this.classStudentModelAction.list({
        filterRecordOptions: {
          student: { id: studentId },
          session_id: sessionId,
          is_active: true,
        },
        relations: { class: true },
      });
      existingAssignment = result.payload[0] || null;
    }

    if (existingAssignment && existingAssignment.class.id !== targetClassId) {
      const className = `${existingAssignment.class.name}${existingAssignment.class.arm ? ` (${existingAssignment.class.arm})` : ''}`;
      this.logger.warn('Student already in another class', {
        studentId,
        existingClassId: existingAssignment.class.id,
        existingClassName: className,
        targetClassId,
        sessionId,
      });
      throw new ConflictException(
        `Cannot assign student: Student with ID ${studentId} is already assigned to class ${className} in this academic session.`,
      );
    }
  }

  /**
   * Checks if a student is already assigned to the target class
   * Returns the assignment if found (active or inactive)
   * @param classId - The class ID
   * @param studentId - The student ID
   * @param sessionId - The academic session ID
   * @param manager - Optional transaction manager
   */
  async getExistingAssignment(
    classId: string,
    studentId: string,
    sessionId: string,
    manager?: EntityManager,
  ): Promise<ClassStudent | null> {
    if (manager) {
      return manager.findOne(ClassStudent, {
        where: {
          class: { id: classId },
          student: { id: studentId },
          session_id: sessionId,
        },
      });
    }

    const result = await this.classStudentModelAction.list({
      filterRecordOptions: {
        class: { id: classId },
        student: { id: studentId },
        session_id: sessionId,
      },
    });

    return result.payload[0] || null;
  }
}
