import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GradeSubmission } from '../entities/grade-submission.entity';

@Injectable()
export class GradeSubmissionModelAction extends AbstractModelAction<GradeSubmission> {
  constructor(
    @InjectRepository(GradeSubmission)
    gradeSubmissionRepository: Repository<GradeSubmission>,
  ) {
    super(gradeSubmissionRepository, GradeSubmission);
  }
}
