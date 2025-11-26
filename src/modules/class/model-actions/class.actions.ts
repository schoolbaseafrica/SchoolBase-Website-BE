import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Class } from '../entities/class.entity';
import { IPaginationMeta } from '../types/base-response.interface';

@Injectable()
export class ClassModelAction extends AbstractModelAction<Class> {
  constructor(
    @InjectRepository(Class)
    classRepository: Repository<Class>,
  ) {
    super(classRepository, Class);
  }

  /**
   * Fetches all classes and groups them by class name and academic session.
   */
  public async findAllWithSessionRaw(
    page = 1,
    limit = 20,
  ): Promise<{ payload: Class[]; paginationMeta: Partial<IPaginationMeta> }> {
    const { payload, paginationMeta } = await this.list({
      relations: { academicSession: true },
      order: { name: 'ASC', arm: 'ASC' },
      paginationPayload: { page, limit },
    });
    return { payload, paginationMeta };
  }
}
