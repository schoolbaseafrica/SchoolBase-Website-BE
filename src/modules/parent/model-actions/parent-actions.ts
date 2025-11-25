import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Parent } from '../entities/parent.entity';

@Injectable()
export class ParentModelAction extends AbstractModelAction<Parent> {
  constructor(
    @InjectRepository(Parent)
    parentRepository: Repository<Parent>,
  ) {
    super(parentRepository, Parent);
  }
}
