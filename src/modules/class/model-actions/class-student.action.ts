import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ClassStudent } from '../entities/class-student.entity';

@Injectable()
export class ClassStudentModelAction extends AbstractModelAction<ClassStudent> {
  constructor(
    @InjectRepository(ClassStudent)
    classStudentRepository: Repository<ClassStudent>,
  ) {
    super(classStudentRepository, ClassStudent);
  }
}
