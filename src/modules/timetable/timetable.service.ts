import { Injectable } from '@nestjs/common';

import { TimetableModelAction } from './model-actions/timetable.model-action';

@Injectable()
export class TimetableService {
  constructor(private readonly timetableModelAction: TimetableModelAction) {}

  async create() {
    return 'returns create response';
  }

  async findAll() {
    return 'returns findAll response';
  }

  async findByClass() {
    return 'returns findByClass response';
  }

  async findByTeacher() {
    return 'returns findByTeacher response';
  }

  async findOne() {
    return 'returns findOne response';
  }

  async update() {
    return 'returns update response';
  }

  async remove() {
    return 'returns remove response';
  }

  async archive() {
    return 'returns archive response';
  }
}
