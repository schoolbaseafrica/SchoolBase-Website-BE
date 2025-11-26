import { Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ArrayContains } from 'typeorm';

import * as sysMsg from '../../../constants/system.messages';
import { UserRole } from '../../shared/enums';
import { UserService } from '../../user/user.service';
import { UserModelAction } from '../../user/model-actions/user-actions';
import { TeacherModelAction } from '../../teacher/model-actions/teacher-actions';
import { StudentModelAction } from '../../student/model-actions/student-actions';
import { ParentModelAction } from '../../parent/model-actions/parent-actions';
import {
  DashboardResolvedDataDto,
  DashboardMetadataAdmin,
  DashboardMetadataTeacher,
  DashboardMetadataStudent,
  DashboardMetadataParent,
  StudentChildDto,
} from './dto/dashboard-resolver-response.dto';
import { ModuleDescriptor } from './interface/module-descriptor-interface';
import { User } from 'src/modules/user/entities/user.entity';

@Injectable()
export class ResolverService {
  private readonly logger: Logger;

  constructor(
    private readonly userService: UserService,
    private readonly userModelAction: UserModelAction,
    private readonly teacherModelAction: TeacherModelAction,
    private readonly studentModelAction: StudentModelAction,
    private readonly parentModelAction: ParentModelAction,
    @Inject(WINSTON_MODULE_PROVIDER) baseLogger: Logger,
  ) {
    this.logger = baseLogger.child({ context: ResolverService.name });
  }

  async resolveDashboard(
    userId: string,
    tokenRole: string,
  ): Promise<DashboardResolvedDataDto> {
    // 1. Fetch user from DB
    const user = await this.userService.findOne(userId);

    if (!user || !user.role || user.role.length === 0) {
      this.logger.warn(`User ${userId} has no role assigned`);
      throw new ForbiddenException(sysMsg.FORBIDDEN);
    }

    // 2. Extract DB role
    const dbRole: UserRole = Array.isArray(user.role)
      ? user.role[0]
      : user.role;

    // 3. Validate token role matches DB role
    // 3. Validate token role matches DB role

console.log({
  dbRole,
  tokenRole,
  rawUser: user.role,
});


if (dbRole !== tokenRole) {
  this.logger.warn(
    `Role mismatch for user ${userId}: token=${tokenRole}, db=${dbRole}`,
  );
  throw new ForbiddenException(sysMsg.FORBIDDEN);
}

    if (dbRole !== tokenRole) {
      this.logger.warn(
        `Role mismatch for user ${userId}: token=${tokenRole}, db=${dbRole}`,
      );
      throw new ForbiddenException(sysMsg.FORBIDDEN);
    }

    // 4. Resolve dashboard based on role
    let dashboard: UserRole;
    let modules: ModuleDescriptor[];
    let metadata:
      | DashboardMetadataAdmin
      | DashboardMetadataTeacher
      | DashboardMetadataStudent
      | DashboardMetadataParent;

    switch (dbRole) {
      case UserRole.ADMIN:
        dashboard = UserRole.ADMIN;
        modules = this.getAdminModules();
        metadata = await this.getAdminMetadata();
        break;

      case UserRole.TEACHER:
        dashboard = UserRole.TEACHER;
        modules = this.getTeacherModules();
        metadata = await this.getTeacherMetadata(userId);
        break;

      case UserRole.STUDENT:
        dashboard = UserRole.STUDENT;
        modules = this.getStudentModules();
        metadata = await this.getStudentMetadata(userId);
        break;

      case UserRole.PARENT:
        dashboard = UserRole.PARENT;
        modules = this.getParentModules();
        metadata = await this.getParentMetadata(userId);
        break;

      default:
        this.logger.warn(`User ${userId} has unknown role: ${dbRole}`);
        throw new ForbiddenException(sysMsg.FORBIDDEN);
    }

    this.logger.info(`Dashboard resolved for user ${userId} as ${dashboard}`);

    return {
      dashboard,
      modules,
      metadata,
    };
  }

  // --- HELPER METHODS: MODULE DEFINITIONS ---

  private getAdminModules(): ModuleDescriptor[] {
    return [
      { key: 'users', label: 'User Management', icon: 'users' },
      { key: 'reports', label: 'Reports', icon: 'bar_chart' },
      { key: 'settings', label: 'Settings', icon: 'settings' },
    ];
  }

  private getTeacherModules(): ModuleDescriptor[] {
    return [
      { key: 'classes', label: 'My Classes', icon: 'class' },
      { key: 'timetable', label: 'Timetable', icon: 'calendar_today' },
      { key: 'students', label: 'Students', icon: 'people' },
    ];
  }

  private getStudentModules(): ModuleDescriptor[] {
    return [
      { key: 'courses', label: 'Courses', icon: 'book' },
      { key: 'grades', label: 'Grades', icon: 'grade' },
      { key: 'enrollment', label: 'Enrollment', icon: 'assignment' },
    ];
  }

  private getParentModules(): ModuleDescriptor[] {
    return [
      { key: 'children', label: 'My Children', icon: 'child_care' },
      { key: 'results', label: 'Results', icon: 'assessment' },
    ];
  }

  // --- HELPER METHODS: METADATA FETCHING ---

  private async getAdminMetadata(): Promise<DashboardMetadataAdmin> {
    // Use list() with filterRecordOptions for counting
    const { payload: students } = await this.userModelAction.list({
      filterRecordOptions: {
        role: ArrayContains([UserRole.STUDENT]),
        is_active: true,
      },
    });

    const { payload: teachers } = await this.userModelAction.list({
      filterRecordOptions: {
        role: ArrayContains([UserRole.TEACHER]),
        is_active: true,
      },
    });

    const { payload: parents } = await this.userModelAction.list({
      filterRecordOptions: {
        role: ArrayContains([UserRole.PARENT]),
        is_active: true,
      },
    });

    return {
      total_students: students.length,
      total_teachers: teachers.length,
      total_parents: parents.length,
    };
  }

  private async getTeacherMetadata(
    userId: string,
  ): Promise<DashboardMetadataTeacher> {
    // Use list() with relations support
    const { payload: teachers } = await this.teacherModelAction.list({
      filterRecordOptions: { user_id: userId },
      relations: { class_assignments: true },
    });

    const teacher = teachers.length > 0 ? teachers[0] : null;

    // Since there's no timetable relation yet, return null
    // This will be updated when timetable feature is implemented
    return {
      timetable: null,
    };
  }

  private async getStudentMetadata(
    userId: string,
  ): Promise<DashboardMetadataStudent> {
    // Use list() with relations support
    const { payload: students } = await this.studentModelAction.list({
      filterRecordOptions: { user: { id: userId } },
      relations: { stream: true, user: true },
    });

    const student = students.length > 0 ? students[0] : null;

    // Since there's no enrollment_status field, return default
    // This will be updated when enrollment feature is implemented
    return {
      class: student?.stream?.name || 'Not Assigned',
      enrollment_status: student ? 'Active' : 'Pending',
    };
  }

  private async getParentMetadata(
    userId: string,
  ): Promise<DashboardMetadataParent> {
    // Use list() for querying
    const { payload: parents } = await this.parentModelAction.list({
      filterRecordOptions: { user_id: userId },
    });

    const parent = parents.length > 0 ? parents[0] : null;

    // Since there's no parent-child relationship table yet, return empty array
    // This will be updated when parent-student relationship is implemented
    const children: StudentChildDto[] = [];

    if (parent) {
      this.logger.info(
        `Parent ${parent.id} dashboard resolved. Children relationship not yet implemented.`,
      );
    }

    return {
      children,
    };
  }
}
