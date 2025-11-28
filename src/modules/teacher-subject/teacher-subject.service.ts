import { Injectable } from '@nestjs/common';

import { TeacherSubjectModelAction } from './model-actions/teacher-subject.model-action';

@Injectable()
export class TeacherSubjectService {
  constructor(
    private readonly teacherSubjectModelAction: TeacherSubjectModelAction,
  ) {}

  async create() {
    return 'returns create response';
  }

  async findAll() {
    return 'returns findAll response';
  }

  async findByTeacher() {
    return 'returns findByTeacher response';
  }

  async findBySubject() {
    return 'returns findBySubject response';
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
