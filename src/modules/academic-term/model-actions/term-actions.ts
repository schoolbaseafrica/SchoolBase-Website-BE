import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Term } from '../entities/term.entity';

@Injectable()
export class TermModelAction extends AbstractModelAction<Term> {
  constructor(
    @InjectRepository(Term)
    termRepository: Repository<Term>,
  ) {
    super(termRepository, Term);
  }
}
