import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Class } from '../entities/class.entity';

@Injectable()
export class ClassModelAction extends AbstractModelAction<Class> {
  constructor(
    @InjectRepository(Class)
    classRepository: Repository<Class>,
  ) {
    super(classRepository, Class);
  }
}
