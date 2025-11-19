import { AbstractModelAction } from '@hng-sdk/orm'; // Import the base class
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
}
