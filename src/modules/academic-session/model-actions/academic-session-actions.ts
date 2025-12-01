import { AbstractModelAction } from '@hng-sdk/orm'; // Import the base class
import { GetRecordOptions } from '@hng-sdk/orm/dist/typeorm/options/get-record-generic';
import { ListRecordGeneric } from '@hng-sdk/orm/dist/typeorm/options/list-record-generic';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AcademicSession } from '../entities/academic-session.entity'; // Import the Entity

@Injectable()
export class AcademicSessionModelAction extends AbstractModelAction<AcademicSession> {
  constructor(
    @InjectRepository(AcademicSession)
    sessionRepository: Repository<AcademicSession>,
  ) {
    super(sessionRepository, AcademicSession);
  }

  /**
   * Override list method to add ordering to terms relation
   */
  async list(options?: ListRecordGeneric<AcademicSession>) {
    const result = await super.list(options);

    // Sort terms by startDate for each session in the result
    if (result.payload) {
      result.payload.forEach((session) => {
        if (session.terms && session.terms.length > 0) {
          session.terms.sort(
            (a, b) =>
              new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
          );
        }
      });
    }

    return result;
  }

  /**
   * Override get method to add ordering to terms relation
   */
  async get(options: GetRecordOptions<AcademicSession>) {
    const result = await super.get(options);

    // Sort terms by startDate
    if (result && result.terms && result.terms.length > 0) {
      result.terms.sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      );
    }

    return result;
  }
}
