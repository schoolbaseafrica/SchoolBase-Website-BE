import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../../constants/system.messages';
import {
  AcademicSession,
  SessionStatus,
} from '../../academic-session/entities/academic-session.entity';
import { AcademicSessionModelAction } from '../../academic-session/model-actions/academic-session-actions';
import { Stream } from '../../stream/entities/stream.entity';
import { StudentModelAction } from '../../student/model-actions/student-actions';
import {
  CreateClassDto,
  TeacherAssignmentResponseDto,
  UpdateClassDto,
  AssignStudentsToClassDto,
  StudentAssignmentResponseDto,
} from '../dto';
import { ClassStudent } from '../entities/class-student.entity';
import { ClassStudentModelAction } from '../model-actions/class-student.action';
import { ClassTeacherModelAction } from '../model-actions/class-teacher.action';
import { ClassModelAction } from '../model-actions/class.actions';
import {
  ICreateClassResponse,
  IUpdateClassResponse,
  IGetClassByIdResponse,
} from '../types/base-response.interface';

@Injectable()
export class ClassService {
  private readonly logger: Logger;
  constructor(
    private readonly classModelAction: ClassModelAction,
    private readonly sessionModelAction: AcademicSessionModelAction,
    private readonly classTeacherModelAction: ClassTeacherModelAction,
    private readonly classStudentModelAction: ClassStudentModelAction,
    private readonly studentModelAction: StudentModelAction,
    private readonly academicSessionModelAction: AcademicSessionModelAction,
    private readonly dataSource: DataSource,
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
        session_id:
          typeof target_session === 'string'
            ? target_session
            : target_session.id,
        is_active: true,
      },
      relations: {
        teacher: { user: true },
        class: { streams: true },
      },
    });

    // 4. Map to DTO
    return assignments.payload.map((assignment) => {
      const streamList: Stream[] = assignment.class.streams || [];
      const streamNames = streamList.map((s) => s.name).join(', ');
      return {
        teacher_id: assignment.teacher.id,
        name: assignment.teacher.user
          ? `${assignment.teacher.user.first_name} ${assignment.teacher.user.last_name}`
          : `Teacher ${assignment.teacher.employment_id}`,
        assignment_date: assignment.assignment_date,
        streams: streamNames,
      };
    });
  }

  /**
   * Creates a class and links it to the active academic session.
   */
  async create(createClassDto: CreateClassDto): Promise<ICreateClassResponse> {
    const { name, arm, teacherIds } = createClassDto;

    // Validate teacherIds are valid UUIDs
    if (Array.isArray(teacherIds)) {
      for (const teacherId of teacherIds) {
        if (!isUUID(teacherId)) {
          throw new BadRequestException(sysMsg.INVALID_TEACHER_ID);
        }
      }
    }

    // Fetch active academic session
    const academicSession = await this.getActiveSession();

    const { payload } = await this.classModelAction.find({
      findOptions: {
        name,
        arm,
        academicSession: { id: academicSession.id },
      },
      transactionOptions: {
        useTransaction: false,
      },
    });
    if (payload.length > 0) {
      throw new ConflictException(sysMsg.CLASS_ALREADY_EXIST);
    }

    // Use transaction for atomic creation
    const createdClass = await this.dataSource.transaction(async (manager) => {
      const newClass = await this.classModelAction.create({
        createPayload: {
          name,
          arm,
          academicSession,
        },
        transactionOptions: {
          useTransaction: true,
          transaction: manager,
        },
      });

      // Assign teachers if provided
      if (Array.isArray(teacherIds) && teacherIds.length) {
        for (const teacherId of teacherIds) {
          await this.classTeacherModelAction.create({
            createPayload: {
              class: newClass,
              teacher: { id: teacherId },
              session_id: academicSession.id,
              is_active: true,
              assignment_date: new Date(),
            },
            transactionOptions: {
              useTransaction: true,
              transaction: manager,
            },
          });
        }
      }

      this.logger.info(sysMsg.CLASS_CREATED, newClass);
      return newClass;
    });

    return {
      message: sysMsg.CLASS_CREATED,
      id: createdClass.id,
      name: createdClass.name,
      arm: createdClass.arm,
      academicSession: {
        id: academicSession.id,
        name: academicSession.name,
      },
      teacherIds: teacherIds || [],
    };
  }

  /**
   * Fetches the active academic session entity.
   */
  private async getActiveSession(): Promise<AcademicSession> {
    const { payload } = await this.academicSessionModelAction.list({
      filterRecordOptions: { status: SessionStatus.ACTIVE },
    });
    if (!payload.length) throw new NotFoundException('No active session found');
    if (payload.length > 1)
      throw new ConflictException('Multiple active sessions found');
    return payload[0];
  }

  /**
   * Updates the name and/or arm of an existing class, ensuring uniqueness within the session.
   */
  async updateClass(
    classId: string,
    updateClassDto: UpdateClassDto,
  ): Promise<IUpdateClassResponse> {
    // 1. Fetch class by ID
    const existingClass = await this.classModelAction.get({
      identifierOptions: { id: classId },
      relations: { academicSession: true },
    });
    if (!existingClass) {
      throw new NotFoundException(sysMsg.CLASS_NOT_FOUND);
    }

    // 2. Prepare new values
    const { name, arm } = updateClassDto;
    const newName = name ?? existingClass.name;
    const newArm = arm ?? existingClass.arm;
    const sessionId = existingClass.academicSession.id;

    // Prevent empty class name
    if (name !== undefined && (!newName || newName.trim() === '')) {
      throw new BadRequestException(sysMsg.CLASS_NAME_EMPTY);
    }

    // 3. Check uniqueness
    const { payload } = await this.classModelAction.find({
      findOptions: {
        name: newName,
        arm: newArm,
        academicSession: { id: sessionId },
      },
      transactionOptions: { useTransaction: false },
    });
    if (payload.length > 0 && payload[0].id !== classId) {
      throw new ConflictException(sysMsg.CLASS_ALREADY_EXIST);
    }

    // 4. Update and save
    existingClass.name = newName;
    existingClass.arm = newArm;
    await this.classModelAction.update({
      identifierOptions: { id: classId },
      updatePayload: { name: newName, arm: newArm },
      transactionOptions: { useTransaction: false },
    });

    // 5. Return response
    return {
      message: sysMsg.CLASS_UPDATED,
      id: existingClass.id,
      name: existingClass.name,
      arm: existingClass.arm,
      academicSession: {
        id: sessionId,
        name: existingClass.academicSession.name,
      },
    };
  }

  /**
   * Fetches all classes grouped by name and academic session, including arm.
   */
  async getGroupedClasses(page = 1, limit = 20) {
    // Use generic list method from AbstractModelAction
    const { payload: classesRaw, paginationMeta } =
      await this.classModelAction.list({
        relations: { academicSession: true },
        order: { name: 'ASC', arm: 'ASC' },
        paginationPayload: { page, limit },
      });

    const classes = Array.isArray(classesRaw) ? classesRaw : [];

    const grouped: Record<
      string,
      {
        name: string;
        academicSession: { id: string; name: string };
        classes: { id: string; arm?: string }[];
      }
    > = {};

    for (const cls of classes) {
      const key = `${cls.name}_${cls.academicSession.id}`;
      if (!grouped[key]) {
        grouped[key] = {
          name: cls.name,
          academicSession: {
            id: cls.academicSession.id,
            name: cls.academicSession.name,
          },
          classes: [],
        };
      }
      grouped[key].classes.push({ id: cls.id, arm: cls.arm });
    }

    return {
      message: sysMsg.CLASS_FETCHED,
      items: Object.values(grouped),
      pagination: paginationMeta,
    };
  }

  /**
   * Fetches a class by its ID.
   */
  async getClassById(classId: string): Promise<IGetClassByIdResponse> {
    const classEntity = await this.classModelAction.get({
      identifierOptions: { id: classId },
      relations: { academicSession: true },
    });
    if (!classEntity) {
      throw new NotFoundException(sysMsg.CLASS_NOT_FOUND);
    }
    return {
      message: sysMsg.CLASS_FETCHED,
      id: classEntity.id,
      name: classEntity.name,
      arm: classEntity.arm,
      academicSession: {
        id: classEntity.academicSession.id,
        name: classEntity.academicSession.name,
      },
    };
  }

  /**
   * Fetches Total Number of Classes in the System.
   */
  async getTotalClasses(
    sessionId: string,
    name?: string,
    arm?: string,
  ): Promise<{ message: string; total: number }> {
    const filter: Record<string, unknown> = {
      academicSession: { id: sessionId },
    };
    if (name) filter.name = name;
    if (arm) filter.arm = arm;

    const { paginationMeta } = await this.classModelAction.list({
      filterRecordOptions: filter,
      paginationPayload: { page: 1, limit: 1 },
    });
    return {
      message: sysMsg.TOTAL_CLASSES_FETCHED,
      total: paginationMeta.total,
    };
  }

  /**
   * Assigns multiple students to a class.
   * Uses the class's academic session automatically.
   */
  async assignStudentsToClass(
    classId: string,
    assignStudentsDto: AssignStudentsToClassDto,
  ): Promise<{
    message: string;
    assigned: number;
    skipped: number;
    classId: string;
  }> {
    // 1. Validate class exists and get its academic session
    const classExist = await this.classModelAction.get({
      identifierOptions: { id: classId },
      relations: { academicSession: true },
    });
    if (!classExist) {
      throw new NotFoundException(`Class with ID ${classId} not found`);
    }

    // 2. Use the class's academic session (classes are always tied to a session)
    const sessionId = classExist.academicSession.id;

    // 3. Validate all student IDs exist
    const { studentIds } = assignStudentsDto;
    for (const studentId of studentIds) {
      const student = await this.studentModelAction.get({
        identifierOptions: { id: studentId },
      });
      if (!student) {
        throw new NotFoundException(`Student with ID ${studentId} not found`);
      }
    }

    // 4. Check for existing assignments and assign in transaction
    let assignedCount = 0;
    let skippedCount = 0;
    await this.dataSource.transaction(async (manager) => {
      for (const studentId of studentIds) {
        // Check if assignment already exists using repository through transaction manager
        const existingAssignment = await manager.findOne(ClassStudent, {
          where: {
            class: { id: classId },
            student: { id: studentId },
            session_id: sessionId,
            is_active: true,
          },
        });

        if (!existingAssignment) {
          // Create new assignment
          await this.classStudentModelAction.create({
            createPayload: {
              class: { id: classId },
              student: { id: studentId },
              session_id: sessionId,
              is_active: true,
              enrollment_date: new Date(),
            },
            transactionOptions: {
              useTransaction: true,
              transaction: manager,
            },
          });
          assignedCount++;
        } else {
          skippedCount++;
        }
      }
    });

    this.logger.info(
      `Assigned ${assignedCount} students, skipped ${skippedCount} (already assigned) to class ${classId}`,
      {
        classId,
        studentIds,
        sessionId,
        assignedCount,
        skippedCount,
      },
    );

    // Build appropriate message based on results
    let message = '';
    if (assignedCount > 0 && skippedCount > 0) {
      message = `Successfully assigned ${assignedCount} student(s) to class. ${skippedCount} student(s) were already assigned and skipped.`;
    } else if (assignedCount > 0) {
      message = `Successfully assigned ${assignedCount} student(s) to class.`;
    } else if (skippedCount > 0) {
      message = `All ${skippedCount} student(s) were already assigned to this class. No new assignments made.`;
    } else {
      message = `No students were assigned.`;
    }

    return {
      message,
      assigned: assignedCount,
      skipped: skippedCount,
      classId,
    };
  }

  /**
   * Fetches students for a specific class.
   * Uses the class's academic session automatically.
   */
  async getStudentsByClass(
    classId: string,
    sessionId?: string,
  ): Promise<StudentAssignmentResponseDto[]> {
    // 1. Validate class exists and get its academic session
    const classExist = await this.classModelAction.get({
      identifierOptions: { id: classId },
      relations: { academicSession: true },
    });
    if (!classExist) {
      throw new NotFoundException(`Class with ID ${classId} not found`);
    }

    // 2. Use the class's academic session (or provided sessionId for filtering)
    const target_session_id = sessionId || classExist.academicSession.id;

    // 3. Fetch Assignments with Relations
    const assignments = await this.classStudentModelAction.list({
      filterRecordOptions: {
        class: { id: classId },
        session_id: target_session_id,
        is_active: true,
      },
      relations: {
        student: { user: true },
      },
    });

    // 4. Map to DTO
    return assignments.payload.map((assignment) => {
      const student = assignment.student;
      const user = student.user;
      const fullName = user
        ? `${user.first_name} ${user.last_name}`
        : `Student ${student.registration_number}`;
      return {
        student_id: student.id,
        registration_number: student.registration_number,
        name: fullName,
        enrollment_date: assignment.enrollment_date,
        is_active: assignment.is_active,
      };
    });
  }
}
