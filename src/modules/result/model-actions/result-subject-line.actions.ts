import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ResultSubjectLine } from '../entities/result-subject-line.entity';

@Injectable()
export class ResultSubjectLineModelAction extends AbstractModelAction<ResultSubjectLine> {
  constructor(
    @InjectRepository(ResultSubjectLine)
    resultSubjectLineRepository: Repository<ResultSubjectLine>,
  ) {
    super(resultSubjectLineRepository, ResultSubjectLine);
  }
}
