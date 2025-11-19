import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

import * as sysMsg from '../../constants/system.messages';

import { CreateAcademicSessionDto } from './dto/create-academic-session.dto';
import { AcademicSession } from './entities/academic-session.entity';
import { AcademicSessionModelAction } from './model-actions/academic-session-actions';

export interface ICreateSessionResponse {
  status_code: HttpStatus;
  message: string;
  data: AcademicSession;
}
@Injectable()
export class AcademicSessionService {
  constructor(
    private readonly sessionModelAction: AcademicSessionModelAction,
  ) {}
  async create(
    createSessionDto: CreateAcademicSessionDto,
  ): Promise<ICreateSessionResponse> {
    const existingSession = await this.sessionModelAction.get({
      identifierOptions: { name: createSessionDto.name },
    });

    if (existingSession) {
      throw new ConflictException(sysMsg.DUPLICATE_SESSION_NAME);
    }

    // Convert date strings to Date objects for comparison
    const start = new Date(createSessionDto.startDate);
    if (start < new Date()) {
      throw new BadRequestException(sysMsg.START_DATE_IN_PAST);
    }
    const end = new Date(createSessionDto.endDate);
    if (end < new Date()) {
      throw new BadRequestException(sysMsg.END_DATE_IN_PAST);
    }
    // 4. End date must be after start date.
    if (end <= start) {
      throw new BadRequestException(sysMsg.INVALID_DATE_RANGE);
    }
    const newSession = await this.sessionModelAction.create({
      createPayload: {
        name: createSessionDto.name,
        startDate: start,
        endDate: end,
      },
      transactionOptions: {
        useTransaction: false,
      },
    });
    return {
      status_code: HttpStatus.OK,
      message: sysMsg.ACADEMIC_SESSION_CREATED,
      data: newSession,
    };
  }

  findAll() {
    return `This action returns all academicSession`;
  }

  findOne(id: number) {
    return `This action returns a #${id} academicSession`;
  }

  update(id: number) {
    return `This action updates a #${id} academicSession`;
  }

  remove(id: number) {
    return `This action removes a #${id} academicSession`;
  }
}
