import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';

import * as sysMsg from '../../constants/system.messages';

import { CreateTermDto } from './dto/create-term.dto';
import { UpdateTermDto } from './dto/update-term.dto';
import { Term, TermName, TermStatus } from './entities/term.entity';
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
    const currentDate = new Date();

    for (let i = 0; i < termDtos.length; i++) {
      const dto = termDtos[i];
      const startDate = new Date(dto.startDate);
      const endDate = new Date(dto.endDate);

      // Determine if this term should be the current active term based on dates
      const isCurrent = currentDate >= startDate && currentDate <= endDate;

      const createdTerm = await this.termModelAction.create({
        createPayload: {
          sessionId: sessionId,
          name: termNamesByOrder[i],
          startDate: startDate,
          endDate: endDate,
          isCurrent: isCurrent,
          status: TermStatus.ACTIVE,
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

  /**
   * Updates the active term status based on current date.
   * Only one term should be active (isCurrent=true) at a time.
   * This is automatically called when fetching terms.
   */
  private async updateActiveTermStatus(sessionId: string): Promise<void> {
    const terms = await this.termModelAction.list({
      filterRecordOptions: { sessionId },
      order: { startDate: 'ASC' },
    });

    const currentDate = new Date();
    let hasActiveTerm = false;

    for (const term of terms.payload) {
      const isInDateRange =
        currentDate >= new Date(term.startDate) &&
        currentDate <= new Date(term.endDate);

      // Only update if the current status doesn't match what it should be
      if (isInDateRange && !term.isCurrent && !hasActiveTerm) {
        await this.termModelAction.update({
          identifierOptions: { id: term.id },
          updatePayload: { isCurrent: true },
          transactionOptions: { useTransaction: false },
        });
        hasActiveTerm = true;
      } else if ((!isInDateRange || hasActiveTerm) && term.isCurrent) {
        await this.termModelAction.update({
          identifierOptions: { id: term.id },
          updatePayload: { isCurrent: false },
          transactionOptions: { useTransaction: false },
        });
      }
    }
  }

  async findTermsBySessionId(sessionId: string): Promise<Term[]> {
    // Update active term status before returning results
    await this.updateActiveTermStatus(sessionId);

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

    // Update active term status for the session before returning
    await this.updateActiveTermStatus(termEntity.sessionId);

    // Fetch the term again to get updated isCurrent status
    const updatedTermEntity = await this.termModelAction.get({
      identifierOptions: { id },
    });

    return updatedTermEntity;
  }

  async updateTerm(id: string, updateDto: UpdateTermDto): Promise<Term> {
    const termEntity = await this.termModelAction.get({
      identifierOptions: { id },
    });

    if (!termEntity) {
      throw new NotFoundException(sysMsg.TERM_NOT_FOUND);
    }

    // Prevent modification of archived terms
    if (termEntity.status === TermStatus.ARCHIVED) {
      throw new BadRequestException(sysMsg.ARCHIVED_TERM_LOCKED);
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

    // Update active term status after date changes
    await this.updateActiveTermStatus(termEntity.sessionId);

    // Fetch the term again to get updated isCurrent status
    const finalTerm = await this.termModelAction.get({
      identifierOptions: { id },
    });

    return finalTerm;
  }

  // Internal method: Used by academic-session service to archive terms when session is archived
  async archiveTermsBySessionId(
    sessionId: string,
    manager?: EntityManager,
  ): Promise<void> {
    await this.termModelAction.update({
      identifierOptions: { sessionId },
      updatePayload: { status: TermStatus.ARCHIVED },
      transactionOptions: {
        useTransaction: !!manager,
        transaction: manager,
      },
    });
  }
}
