import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Subject } from '../entities/subject.entity';

@Injectable()
export class SubjectModelAction extends AbstractModelAction<Subject> {
  constructor(
    @InjectRepository(Subject)
    subjectRepository: Repository<Subject>,
  ) {
    super(subjectRepository, Subject);
  }
}
