import { ForbiddenException } from '@nestjs/common';
import { Logger } from 'winston';

import { ParentModelAction } from '../../parent/model-actions/parent-actions';
import { UserRole } from '../../shared/enums';
import { StudentModelAction } from '../../student/model-actions/student-actions';
import { TeacherModelAction } from '../../teacher/model-actions/teacher-actions';
import { UserModelAction } from '../../user/model-actions/user-actions';
import { UserService } from '../../user/user.service';

import { DASHBOARD_MODULES } from './dashboard-module';
import { ResolverService } from './resolver.service';

describe('ResolverService', () => {
  let service: ResolverService;
  let userService: UserService;
  let userModelAction: UserModelAction;
  let teacherModelAction: TeacherModelAction;
  let studentModelAction: StudentModelAction;
  let parentModelAction: ParentModelAction;
  let logger: Logger;

  beforeEach(() => {
    userService = {
      findOne: jest.fn(),
    } as unknown as UserService;
    userModelAction = {
      list: jest.fn(),
    } as unknown as UserModelAction;
    teacherModelAction = {
      list: jest.fn(),
    } as unknown as TeacherModelAction;
    studentModelAction = {
      list: jest.fn(),
    } as unknown as StudentModelAction;
    parentModelAction = {
      list: jest.fn(),
    } as unknown as ParentModelAction;
    logger = {
      child: () => logger,
      warn: jest.fn(),
      info: jest.fn(),
    } as unknown as Logger;

    service = new ResolverService(
      userService,
      userModelAction,
      teacherModelAction,
      studentModelAction,
      parentModelAction,
      logger,
    );
  });

  it('should resolve ADMIN dashboard with correct modules and metadata', async () => {
    (userService.findOne as jest.Mock).mockResolvedValue({
      id: '1',
      role: [UserRole.ADMIN],
    });
    (userModelAction.list as jest.Mock)
      .mockResolvedValueOnce({ payload: [{}, {}] })
      .mockResolvedValueOnce({ payload: [{}] })
      .mockResolvedValueOnce({ payload: [{}] });

    const result = await service.resolveDashboard('1', UserRole.ADMIN);

    expect(result.dashboard).toBe(UserRole.ADMIN);
    expect(result.modules).toEqual(DASHBOARD_MODULES[UserRole.ADMIN]);
    expect(result.metadata).toEqual({
      total_students: 2,
      total_teachers: 1,
      total_parents: 1,
    });
  });

  it('should throw ForbiddenException if user has no role', async () => {
    (userService.findOne as jest.Mock).mockResolvedValue({ id: '1', role: [] });

    await expect(service.resolveDashboard('1', UserRole.ADMIN)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should throw ForbiddenException if token role does not match DB role', async () => {
    (userService.findOne as jest.Mock).mockResolvedValue({
      id: '1',
      role: [UserRole.TEACHER],
    });

    await expect(service.resolveDashboard('1', UserRole.ADMIN)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
