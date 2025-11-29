import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SuperadminSession } from './entities/superadmin-session.entity';
import { SuperadminSessionService } from './superadmin-session.service';

@Module({
  imports: [TypeOrmModule.forFeature([SuperadminSession])],
  providers: [SuperadminSessionService],
  exports: [SuperadminSessionService],
})
export class SuperadminSessionModule {}
