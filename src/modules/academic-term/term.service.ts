import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';

import * as sysMsg from '../../constants/system.messages';

import { CreateTermDto } from './dto/create-term.dto';
import { UpdateTermDto } from './dto/update-term.dto';
import { Term, TermName } from './entities/term.entity';
import { TermModelAction } from './model-actions';

@Injectable()
export class TermService {
  constructor(private readonly termModelAction: TermModelAction) {}

  async createTermsForSession(
    sessionId: string,
    termDtos: CreateTermDto[],
    manager?: EntityManager,
  ): Promise<Term[]> {
    const createdTermEntities: Term[] = [];
    const termNamesByOrder = [TermName.FIRST, TermName.SECOND, TermName.THIRD];

    for (let i = 0; i < termDtos.length; i++) {
      const dto = termDtos[i];
      const createdTerm = await this.termModelAction.create({
        createPayload: {
          sessionId: sessionId,
          name: termNamesByOrder[i],
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          isCurrent: false,
        },
        transactionOptions: {
          useTransaction: !!manager,
          transaction: manager,
        },
      });
      createdTermEntities.push(createdTerm);
    }

    return createdTermEntities;
  }

  async findTermsBySessionId(sessionId: string): Promise<Term[]> {
    const { payload: termEntities } = await this.termModelAction.list({
      filterRecordOptions: { sessionId },
      order: { startDate: 'ASC' },
    });

    return termEntities;
  }

  async findOne(id: string): Promise<Term | null> {
    const termEntity = await this.termModelAction.get({
      identifierOptions: { id },
    });

    if (!termEntity) {
      throw new NotFoundException(sysMsg.TERM_NOT_FOUND);
    }

    return termEntity;
  }

  async updateTerm(id: string, updateDto: UpdateTermDto): Promise<Term> {
    const termEntity = await this.termModelAction.get({
      identifierOptions: { id },
    });

    if (!termEntity) {
      throw new NotFoundException(sysMsg.TERM_NOT_FOUND);
    }

    // Validation for updating both dates
    if (updateDto.startDate && updateDto.endDate) {
      const startDate = new Date(updateDto.startDate);
      const endDate = new Date(updateDto.endDate);

      if (endDate <= startDate) {
        throw new BadRequestException(sysMsg.TERM_INVALID_DATE_RANGE);
      }
    }

    // Validation for updating only the start date
    if (updateDto.startDate && !updateDto.endDate) {
      const startDate = new Date(updateDto.startDate);
      if (termEntity.endDate <= startDate) {
        throw new BadRequestException(sysMsg.TERM_START_AFTER_END);
      }
    }

    // Validation for updating only the end date
    if (updateDto.endDate && !updateDto.startDate) {
      const endDate = new Date(updateDto.endDate);
      if (endDate <= termEntity.startDate) {
        throw new BadRequestException(sysMsg.TERM_END_BEFORE_START);
      }
    }

    const updatePayload: Partial<Term> = {};
    if (updateDto.startDate) {
      updatePayload.startDate = new Date(updateDto.startDate);
    }
    if (updateDto.endDate) {
      updatePayload.endDate = new Date(updateDto.endDate);
    }

    const updatedTerm = await this.termModelAction.update({
      identifierOptions: { id },
      updatePayload,
      transactionOptions: {
        useTransaction: false,
      },
    });

    if (!updatedTerm) {
      throw new BadRequestException(sysMsg.TERM_UPDATE_FAILED);
    }

    return updatedTerm;
  }

  // Internal method: Used only by academic-session service or cascade delete
  // Terms should not be individually deletable as sessions must have exactly 3 terms
  async deleteTermsBySessionId(
    sessionId: string,
    manager?: EntityManager,
  ): Promise<void> {
    await this.termModelAction.delete({
      identifierOptions: { sessionId },
      transactionOptions: {
        useTransaction: !!manager,
        transaction: manager,
      },
    });
  }
}
