import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Grade } from '../entities/grade.entity';

@Injectable()
export class GradeModelAction extends AbstractModelAction<Grade> {
  constructor(
    @InjectRepository(Grade)
    gradeRepository: Repository<Grade>,
  ) {
    super(gradeRepository, Grade);
  }
}
