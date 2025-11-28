import { Injectable } from '@nestjs/common';

import { TimetableModelAction } from './model-actions/timetable.model-action';
import { TimetableValidationService } from './services/timetable-validation.service';

@Injectable()
export class TimetableService {
  constructor(
    private readonly timetableModelAction: TimetableModelAction,
    private readonly validationService: TimetableValidationService,
  ) {}

  async create() {
    // TODO: Uncomment when implementing create method
    // await this.validationService.validateTimetableRules(createTimetableDto);
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
    // TODO: Uncomment when implementing update method
    // await this.validationService.validateTimetableRules(updateTimetableDto);
    return 'returns update response';
  }

  async remove() {
    return 'returns remove response';
  }

  async archive() {
    return 'returns archive response';
  }
}
