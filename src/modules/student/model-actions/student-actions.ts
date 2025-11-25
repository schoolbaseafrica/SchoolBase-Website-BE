import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Student } from '../entities';

@Injectable()
export class StudentModelAction extends AbstractModelAction<Student> {
  constructor(
    @InjectRepository(Student)
    studentRepository: Repository<Student>,
  ) {
    super(studentRepository, Student);
  }
}
