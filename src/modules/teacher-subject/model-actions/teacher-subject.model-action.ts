import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TeacherSubject } from '../entities/teacher-subject.entity';

@Injectable()
export class TeacherSubjectModelAction extends AbstractModelAction<TeacherSubject> {
  constructor(
    @InjectRepository(TeacherSubject)
    teacherSubjectRepository: Repository<TeacherSubject>,
  ) {
    super(teacherSubjectRepository, TeacherSubject);
  }
}
