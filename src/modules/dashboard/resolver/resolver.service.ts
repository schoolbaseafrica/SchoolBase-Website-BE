import { Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ArrayContains } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../../constants/system.messages';
import { ParentModelAction } from '../../parent/model-actions/parent-actions';
import { UserRole } from '../../shared/enums';
import { StudentModelAction } from '../../student/model-actions/student-actions';
import { TeacherModelAction } from '../../teacher/model-actions/teacher-actions';
import { UserModelAction } from '../../user/model-actions/user-actions';
import { UserService } from '../../user/user.service';

import { DASHBOARD_MODULES } from './dashboard-module';
import {
  DashboardResolvedDataDto,
  DashboardMetadataAdmin,
  DashboardMetadataTeacher,
  DashboardMetadataStudent,
  DashboardMetadataParent,
  StudentChildDto,
} from './dto/dashboard-resolver-response.dto';
import { IModuleDescriptor } from './interface/module-descriptor-interface';

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
    tokenRole: UserRole[],
  ): Promise<DashboardResolvedDataDto> {
    const user = await this.userService.findOne(userId);

    if (!user || !user.role || user.role.length === 0) {
      this.logger.warn(`User ${userId} has no role assigned`);
      throw new ForbiddenException(sysMsg.FORBIDDEN);
    }

    const dbRole: UserRole = Array.isArray(user.role)
      ? user.role[0]
      : user.role;

    const tokenRoles = Array.isArray(tokenRole) ? tokenRole : [tokenRole];
    const roleMatch = tokenRoles.includes(dbRole);

    if (!roleMatch) {
      this.logger.warn(
        `Role mismatch for user ${userId}: token=${tokenRoles}, db=${dbRole}`,
      );
      throw new ForbiddenException(sysMsg.FORBIDDEN);
    }

    let dashboard: UserRole;
    let modules: IModuleDescriptor[];
    let metadata:
      | DashboardMetadataAdmin
      | DashboardMetadataTeacher
      | DashboardMetadataStudent
      | DashboardMetadataParent;

    switch (dbRole) {
      case UserRole.ADMIN:
        dashboard = UserRole.ADMIN;
        modules = DASHBOARD_MODULES[UserRole.ADMIN];
        metadata = await this.getAdminMetadata();
        break;

      case UserRole.TEACHER:
        dashboard = UserRole.TEACHER;
        modules = DASHBOARD_MODULES[UserRole.TEACHER];
        metadata = await this.getTeacherMetadata(userId);
        break;

      case UserRole.STUDENT:
        dashboard = UserRole.STUDENT;
        modules = DASHBOARD_MODULES[UserRole.STUDENT];
        metadata = await this.getStudentMetadata(userId);
        break;

      case UserRole.PARENT:
        dashboard = UserRole.PARENT;
        modules = DASHBOARD_MODULES[UserRole.PARENT];
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

  private async getAdminMetadata(): Promise<DashboardMetadataAdmin> {
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
    await this.teacherModelAction.list({
      filterRecordOptions: { user_id: userId },
      relations: { class_assignments: true },
    });

    return {
      timetable: null,
    };
  }

  private async getStudentMetadata(
    userId: string,
  ): Promise<DashboardMetadataStudent> {
    const { payload: students } = await this.studentModelAction.list({
      filterRecordOptions: { user: { id: userId } },
      relations: { stream: true, user: true },
    });

    const student = students.length > 0 ? students[0] : null;

    return {
      class: student?.stream?.name || 'Not Assigned',
      enrollment_status: student ? 'Active' : 'Pending',
    };
  }

  private async getParentMetadata(
    userId: string,
  ): Promise<DashboardMetadataParent> {
    const { payload: parents } = await this.parentModelAction.list({
      filterRecordOptions: { user_id: userId },
    });

    const children: StudentChildDto[] = [];

    if (parents.length > 0) {
      this.logger.info(
        `Parent ${parents[0].id} dashboard resolved. Children relationship not yet implemented.`,
      );
    }

    return {
      children,
    };
  }
}
