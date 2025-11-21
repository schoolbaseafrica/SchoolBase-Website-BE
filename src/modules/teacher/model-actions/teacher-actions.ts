import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Teacher } from '../entities/teacher.entity';

@Injectable()
export class TeacherModelAction extends AbstractModelAction<Teacher> {
  constructor(
    @InjectRepository(Teacher)
    teacherRepository: Repository<Teacher>,
  ) {
    super(teacherRepository, Teacher);
  }
}
