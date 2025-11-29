import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Term } from './entities/term.entity';
import { TermModelAction } from './model-actions';
import { TermController } from './term.controller';
import { TermService } from './term.service';

@Module({
  imports: [TypeOrmModule.forFeature([Term])],
  controllers: [TermController],
  providers: [TermService, TermModelAction],
  exports: [TermService, TermModelAction],
})
export class TermModule {}
