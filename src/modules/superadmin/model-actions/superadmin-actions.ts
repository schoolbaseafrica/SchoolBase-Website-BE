import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SuperAdmin } from '../entities/superadmin.entity';

@Injectable()
export class SuperadminModelAction extends AbstractModelAction<SuperAdmin> {
  constructor(
    @InjectRepository(SuperAdmin)
    superadminRepository: Repository<SuperAdmin>,
  ) {
    super(superadminRepository, SuperAdmin);
  }
}
