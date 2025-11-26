import { Module } from '@nestjs/common';
import { ResolverController } from './resolver.controller';
import { ResolverService } from './resolver.service';
import { UserModule } from '../../user/user.module';
import { TeachersModule } from '../../teacher/teacher.module';
import { StudentModule } from '../../student/student.module';
import { ParentModule } from '../../parent/parent.module';

@Module({
  imports: [UserModule, TeachersModule, StudentModule, ParentModule],
  controllers: [ResolverController],
  providers: [ResolverService],
})
export class ResolverModule {}
