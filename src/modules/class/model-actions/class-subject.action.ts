import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, InsertResult, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { ClassSubject } from '../entities';

type CreateManyRecordType = {
  createPayloads: QueryDeepPartialEntity<ClassSubject>[];
  transactionOptions:
    | {
        useTransaction: false;
      }
    | {
        useTransaction: true;
        transaction: EntityManager;
      };
};

@Injectable()
export class ClassSubjectModelAction extends AbstractModelAction<ClassSubject> {
  constructor(
    @InjectRepository(ClassSubject)
    classSubjectRepository: Repository<ClassSubject>,
  ) {
    super(classSubjectRepository, ClassSubject);
  }

  /**
   * Bulk insert multiple ClassStudent records.
   * Uses TypeORM insert for performance.
   * @param records Array of ClassStudent partial objects to insert
   */
  async createMany(data: CreateManyRecordType): Promise<InsertResult> {
    const { createPayloads, transactionOptions } = data;

    if (!createPayloads || createPayloads.length === 0) return;

    if (transactionOptions.useTransaction) {
      return transactionOptions.transaction.insert(
        ClassSubject,
        createPayloads,
      );
    } else {
      return this.repository.insert(createPayloads);
    }
  }
}
