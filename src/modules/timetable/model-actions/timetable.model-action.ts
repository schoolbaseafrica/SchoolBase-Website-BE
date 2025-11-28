import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Timetable } from '../entities/timetable.entity';

@Injectable()
export class TimetableModelAction extends AbstractModelAction<Timetable> {
  constructor(
    @InjectRepository(Timetable)
    timetableRepository: Repository<Timetable>,
  ) {
    super(timetableRepository, Timetable);
  }
}
