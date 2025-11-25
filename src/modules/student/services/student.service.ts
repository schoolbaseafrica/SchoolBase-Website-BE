import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

import { CreateStudentDto, UpdateStudentDto } from '../dto';

@Injectable()
export class StudentService {
  private readonly logger: Logger;
  constructor(@Inject(WINSTON_MODULE_PROVIDER) baseLogger: Logger) {
    this.logger = baseLogger.child({ context: StudentService.name });
  }
  create(createStudentDto: CreateStudentDto) {
    return createStudentDto;
  }

  findAll() {
    return `This action returns all term`;
  }

  findOne(id: string) {
    return `This action returns a #${id} term`;
  }

  update(id: string, updateStudentDto: UpdateStudentDto) {
    return `#${id}: ${updateStudentDto}`;
  }

  remove(id: string) {
    return `This action removes a #${id} term`;
  }
}
