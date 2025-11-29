import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Fees } from '../entities/fees.entity';

@Injectable()
export class FeesModelAction extends AbstractModelAction<Fees> {
  constructor(
    @InjectRepository(Fees)
    feeRepository: Repository<Fees>,
  ) {
    super(feeRepository, Fees);
  }
}
