import { Module } from '@nestjs/common';

import { AdminDashboardModule } from './admin-dashboard/admin-dashboard.module';
import { ResolverModule } from './resolver/resolver.module';
import { StudentDashboardModule } from './student-dashboard/student-dashboard.module';
import { TeacherDashboardModule } from './teacher-dashboard/teacher-dashboard.module';

@Module({
  imports: [
    ResolverModule,
    StudentDashboardModule,
    AdminDashboardModule,
    TeacherDashboardModule,
  ],
})
export class DashboardModule { }
