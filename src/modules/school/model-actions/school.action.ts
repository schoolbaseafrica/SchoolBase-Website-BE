import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { School } from '../entities/school.entity';

@Injectable()
export class SchoolModelAction extends AbstractModelAction<School> {
  constructor(
    @InjectRepository(School)
    schoolRepository: Repository<School>,
  ) {
    super(schoolRepository, School);
  }
}
