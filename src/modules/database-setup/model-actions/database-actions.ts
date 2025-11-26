import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Database } from '../entities/database.entity';

@Injectable()
export class DatabaseModelAction extends AbstractModelAction<Database> {
  constructor(
    @InjectRepository(Database)
    databaseRepository: Repository<Database>,
  ) {
    super(databaseRepository, Database);
  }
}
