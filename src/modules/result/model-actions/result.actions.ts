import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Result } from '../entities/result.entity';

@Injectable()
export class ResultModelAction extends AbstractModelAction<Result> {
  constructor(
    @InjectRepository(Result)
    resultRepository: Repository<Result>,
  ) {
    super(resultRepository, Result);
  }
}
