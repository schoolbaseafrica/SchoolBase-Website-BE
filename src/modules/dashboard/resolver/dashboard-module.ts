import { UserRole } from '../../shared/enums';

import { IModuleDescriptor } from './interface/module-descriptor-interface';

export const DASHBOARD_MODULES: Record<UserRole, IModuleDescriptor[]> = {
  [UserRole.ADMIN]: [
    { key: 'users', label: 'User Management', icon: 'users' },
    { key: 'reports', label: 'Reports', icon: 'bar_chart' },
    { key: 'settings', label: 'Settings', icon: 'settings' },
  ],

  [UserRole.TEACHER]: [
    { key: 'classes', label: 'My Classes', icon: 'class' },
    { key: 'timetable', label: 'Timetable', icon: 'calendar_today' },
    { key: 'students', label: 'Students', icon: 'people' },
  ],

  [UserRole.STUDENT]: [
    { key: 'courses', label: 'Courses', icon: 'book' },
    { key: 'grades', label: 'Grades', icon: 'grade' },
    { key: 'enrollment', label: 'Enrollment', icon: 'assignment' },
  ],

  [UserRole.PARENT]: [
    { key: 'children', label: 'My Children', icon: 'child_care' },
    { key: 'results', label: 'Results', icon: 'assessment' },
  ],
};
