import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ClassSubject } from '../entities';

@Injectable()
export class ClassSubjectModelAction extends AbstractModelAction<ClassSubject> {
  constructor(
    @InjectRepository(ClassSubject)
    classSubjectRepository: Repository<ClassSubject>,
  ) {
    super(classSubjectRepository, ClassSubject);
  }
}
