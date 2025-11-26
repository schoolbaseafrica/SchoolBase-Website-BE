import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Department } from '../entities/department.entity';

@Injectable()
export class DepartmentModelAction extends AbstractModelAction<Department> {
  constructor(
    @InjectRepository(Department)
    departmentRepository: Repository<Department>,
  ) {
    super(departmentRepository, Department);
  }
}
