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

  /**
   * Fetches all classes and groups them by class name and academic session.
   */
  public async findAllWithSessionRaw(): Promise<Class[]> {
    const { payload } = await this.list({
      relations: { academicSession: true },
      order: { name: 'ASC', arm: 'ASC' },
    });
    return payload;
  }
}
