import { Module } from '@nestjs/common';

import { SchoolController } from './school.controller';
import { SchoolService } from './school.service';

@Module({
  controllers: [SchoolController],
  providers: [SchoolService],
})
export class SchoolModule {}
