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

    // Get current date without time for accurate date-only comparisons
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (let i = 0; i < termDtos.length; i++) {
      const dto = termDtos[i];
      const startDate = new Date(dto.startDate);
      const endDate = new Date(dto.endDate);

      // Create date-only versions for comparison
      const startDateOnly = new Date(startDate);
      startDateOnly.setHours(0, 0, 0, 0);

      const endDateOnly = new Date(endDate);
      endDateOnly.setHours(0, 0, 0, 0);

      // Determine if this term is currently active based on dates
      const isCurrent = now >= startDateOnly && now <= endDateOnly;

      // Status: Active only if current (today is within term dates), otherwise Inactive
      const termStatus = isCurrent ? TermStatus.ACTIVE : TermStatus.INACTIVE;

      const createdTerm = await this.termModelAction.create({
        createPayload: {
          sessionId: sessionId,
          name: termNamesByOrder[i],
          startDate: startDate,
          endDate: endDate,
          isCurrent: isCurrent,
          status: termStatus,
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
   * Only one term can be active (isCurrent=true) at a time.
   * This method is automatically called when fetching terms.
   */
  private async updateActiveTermStatus(sessionId: string): Promise<void> {
    const terms = await this.termModelAction.list({
      filterRecordOptions: { sessionId },
      order: { startDate: 'ASC' },
    });

    // Get current date without time for accurate comparisons
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let hasActiveTerm = false;

    for (const term of terms.payload) {
      const startDateOnly = new Date(term.startDate);
      startDateOnly.setHours(0, 0, 0, 0);

      const endDateOnly = new Date(term.endDate);
      endDateOnly.setHours(0, 0, 0, 0);

      const isInDateRange = now >= startDateOnly && now <= endDateOnly;
      // Status: Active only if current (today is within term dates), otherwise Inactive
      const correctStatus = isInDateRange
        ? TermStatus.ACTIVE
        : TermStatus.INACTIVE;

      const updatePayload: Partial<Term> = {};
      let needsUpdate = false;

      // Update isCurrent field
      if (isInDateRange && !term.isCurrent && !hasActiveTerm) {
        updatePayload.isCurrent = true;
        needsUpdate = true;
        hasActiveTerm = true;
      } else if ((!isInDateRange || hasActiveTerm) && term.isCurrent) {
        updatePayload.isCurrent = false;
        needsUpdate = true;
      }

      // Update status field if incorrect
      if (term.status !== correctStatus) {
        updatePayload.status = correctStatus;
        needsUpdate = true;
      }

      // Only update if there are changes
      if (needsUpdate) {
        await this.termModelAction.update({
          identifierOptions: { id: term.id },
          updatePayload,
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

    // Prevent modification of inactive terms
    if (termEntity.status === TermStatus.INACTIVE) {
      throw new BadRequestException(sysMsg.ARCHIVED_TERM_LOCKED);
    }

    // Validate date range
    const newStartDate = updateDto.startDate
      ? new Date(updateDto.startDate)
      : termEntity.startDate;
    const newEndDate = updateDto.endDate
      ? new Date(updateDto.endDate)
      : termEntity.endDate;

    if (newEndDate <= newStartDate) {
      throw new BadRequestException(sysMsg.TERM_INVALID_DATE_RANGE);
    }

    // Validate against adjacent terms to ensure sequential order
    const allTerms = await this.termModelAction.list({
      filterRecordOptions: { sessionId: termEntity.sessionId },
      order: { startDate: 'ASC' },
    });

    const terms = allTerms.payload;
    const currentTermIndex = terms.findIndex((t) => t.id === id);

    if (currentTermIndex !== -1) {
      // Check against previous term
      if (currentTermIndex > 0) {
        const previousTerm = terms[currentTermIndex - 1];
        if (newStartDate <= new Date(previousTerm.endDate)) {
          throw new BadRequestException(
            `Term start date must be after the previous term's end date (${previousTerm.endDate}).`,
          );
        }
      }

      // Check against next term
      if (currentTermIndex < terms.length - 1) {
        const nextTerm = terms[currentTermIndex + 1];
        if (newEndDate >= new Date(nextTerm.startDate)) {
          throw new BadRequestException(
            `Term end date must be before the next term's start date (${nextTerm.startDate}).`,
          );
        }
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

  // Internal method: Used by academic-session service to mark terms inactive when session is archived
  async archiveTermsBySessionId(
    sessionId: string,
    manager?: EntityManager,
  ): Promise<void> {
    await this.termModelAction.update({
      identifierOptions: { sessionId },
      updatePayload: { status: TermStatus.INACTIVE, isCurrent: false },
      transactionOptions: {
        useTransaction: !!manager,
        transaction: manager,
      },
    });
  }
}
