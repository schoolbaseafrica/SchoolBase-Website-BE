import {
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { In } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../constants/system.messages';
import { TermModelAction } from '../academic-term/model-actions';
import { ClassModelAction } from '../class/model-actions/class.actions';
import { FeeNotificationService } from '../notification/services/fee-notification.service';
import { FeeNotificationType } from '../shared/enums';

import { FeeComponentResponseDto } from './dto/fee-component-response.dto';
import { FeeStudentResponseDto } from './dto/fee-students-response.dto';
import { CreateFeesDto, QueryFeesDto, UpdateFeesDto } from './dto/fees.dto';
import { GetActiveFeesDto } from './dto/get-active-fees.dto';
import { Fees } from './entities/fees.entity';
import { FeeStatus } from './enums/fees.enums';
import { FeesModelAction } from './model-action/fees.model-action';

@Injectable()
export class FeesService {
  private readonly logger: Logger;

  constructor(
    private readonly feesModelAction: FeesModelAction,
    private readonly termModelAction: TermModelAction,
    private readonly classModelAction: ClassModelAction,
    private readonly feeNotificationService: FeeNotificationService,
    @Inject(WINSTON_MODULE_PROVIDER) logger: Logger,
  ) {
    this.logger = logger.child({ context: FeesService.name });
  }

  async create(createFeesDto: CreateFeesDto, createdBy: string): Promise<Fees> {
    // Validate term exists
    const term = await this.termModelAction.get({
      identifierOptions: { id: createFeesDto.term_id },
    });

    if (!term) {
      throw new BadRequestException(sysMsg.TERM_ID_INVALID);
    }

    // Validate that classes exist
    const classesResult = await this.classModelAction.find({
      findOptions: { id: In(createFeesDto.class_ids) },
      transactionOptions: {
        useTransaction: false,
      },
    });

    const classes = classesResult.payload;
    if (classes.length !== createFeesDto.class_ids.length) {
      throw new BadRequestException(sysMsg.INVALID_CLASS_IDS);
    }

    // Create fee
    const savedFee = await this.feesModelAction.create({
      createPayload: {
        component_name: createFeesDto.component_name,
        description: createFeesDto.description,
        amount: createFeesDto.amount,
        term_id: createFeesDto.term_id,
        created_by: createdBy,
        classes,
      },
      transactionOptions: {
        useTransaction: false,
      },
    });

    this.logger.info('Fee component created successfully', {
      fee_id: savedFee.id,
      component_name: savedFee.component_name,
      amount: savedFee.amount,
      term: savedFee.term,
      class_count: classes.length,
      created_by: createdBy,
    });

    // TODO: Consider emitting an event here for fee update
    // this.eventEmitter.emit('fee.created', savedFee.id);
    await this.feeNotificationService.createAndUpdateFeesNotification(
      savedFee.id,
      FeeNotificationType.CREATED,
    );
    return savedFee;
  }

  async findAll(queryDto: QueryFeesDto): Promise<{
    fees: Fees[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const result = await this.feesModelAction.findAllFees(queryDto);

    this.logger.info('Fetched fee components', {
      total: result.total,
      page: result.page,
      limit: result.limit,
      filters: queryDto,
    });

    return result;
  }

  async update(id: string, updateFeesDto: UpdateFeesDto): Promise<Fees> {
    const existingFee = await this.feesModelAction.get({
      identifierOptions: { id },
      relations: { classes: true },
    });

    if (!existingFee) {
      throw new NotFoundException(sysMsg.FEE_NOT_FOUND);
    }

    // Validate term if provided
    if (updateFeesDto.term_id) {
      const term = await this.termModelAction.get({
        identifierOptions: { id: updateFeesDto.term_id },
      });

      if (!term) {
        throw new BadRequestException(sysMsg.TERM_ID_INVALID);
      }
    }

    // Validate and update classes if provided
    if (updateFeesDto.class_ids) {
      const classesResult = await this.classModelAction.find({
        findOptions: { id: In(updateFeesDto.class_ids) },
        transactionOptions: {
          useTransaction: false,
        },
      });

      const classes = classesResult.payload;
      if (classes.length !== updateFeesDto.class_ids.length) {
        throw new BadRequestException(sysMsg.INVALID_CLASS_IDS);
      }

      existingFee.classes = classes;
    }

    // Update fields
    if (updateFeesDto.component_name !== undefined) {
      existingFee.component_name = updateFeesDto.component_name;
    }
    if (updateFeesDto.description !== undefined) {
      existingFee.description = updateFeesDto.description;
    }
    if (updateFeesDto.amount !== undefined) {
      existingFee.amount = updateFeesDto.amount;
    }
    if (updateFeesDto.term_id !== undefined) {
      existingFee.term_id = updateFeesDto.term_id;
    }
    if (updateFeesDto.status !== undefined) {
      existingFee.status = updateFeesDto.status;
    }

    const updatedFee = await this.feesModelAction.save({
      entity: existingFee,
      transactionOptions: {
        useTransaction: false,
      },
    });

    this.logger.info('Fee component updated successfully', {
      fee_id: updatedFee.id,
      component_name: updatedFee.component_name,
      amount: updatedFee.amount,
      status: updatedFee.status,
    });

    // TODO: Consider emitting an event here for fee update
    // this.eventEmitter.emit('fee.updated', id);
    await this.feeNotificationService.createAndUpdateFeesNotification(
      id,
      FeeNotificationType.UPDATED,
    );

    return updatedFee;
  }

  async findOne(id: string) {
    const existingFee = await this.feesModelAction.get({
      identifierOptions: { id },
      relations: {
        classes: true,
        term: true,
        createdBy: true,
      },
    });

    if (!existingFee) {
      throw new NotFoundException(sysMsg.FEE_NOT_FOUND);
    }

    // Only include safe fields from createdBy
    const limitedCreator = existingFee.createdBy
      ? {
          id: existingFee.createdBy.id,
          first_name: existingFee.createdBy.first_name,
          last_name: existingFee.createdBy.last_name,
          middle_name: existingFee.createdBy.middle_name,
        }
      : null;

    return {
      ...existingFee,
      createdBy: limitedCreator,
    };
  }

  // fees.service.ts - Fix the deactivate method
  async deactivate(
    id: string,
    deactivatedBy: string,
    reason?: string,
  ): Promise<Fees> {
    // Find the fee component - get method doesn't need transactionOptions
    const fee = await this.feesModelAction.get({
      identifierOptions: { id },
    });

    if (!fee) {
      throw new NotFoundException(sysMsg.FEE_NOT_FOUND);
    }

    // Check if already inactive (idempotent)
    if (fee.status === FeeStatus.INACTIVE) {
      this.logger.info('Fee component is already inactive', {
        fee_id: id,
        deactivated_by: deactivatedBy,
      });
      return fee;
    }

    // Update status to inactive with transactionOptions (only update needs it)
    const updatedFee = await this.feesModelAction.update({
      identifierOptions: { id },
      updatePayload: {
        status: FeeStatus.INACTIVE,
      },
      transactionOptions: {
        useTransaction: false,
      },
    });

    this.logger.info('Fee component deactivated successfully', {
      fee_id: id,
      component_name: fee.component_name,
      deactivated_by: deactivatedBy,
      reason,
      previous_status: fee.status,
      new_status: FeeStatus.INACTIVE,
    });

    // TODO: Consider emitting an event here for fee update
    // this.eventEmitter.emit('fee.deactivated', id);
    await this.feeNotificationService.createAndUpdateFeesNotification(
      id,
      FeeNotificationType.DEACTIVATED,
    );

    return updatedFee;
  }

  async activate(id: string, activatedBy: string): Promise<Fees> {
    const fee = await this.feesModelAction.get({
      identifierOptions: { id },
    });

    if (!fee) {
      throw new NotFoundException(sysMsg.FEE_NOT_FOUND);
    }

    if (fee.status === FeeStatus.ACTIVE) {
      this.logger.info('Fee component is already active', {
        fee_id: id,
        activated_by: activatedBy,
      });
      return fee;
    }

    const updatedFee = await this.feesModelAction.update({
      identifierOptions: { id },
      updatePayload: {
        status: FeeStatus.ACTIVE,
      },
      transactionOptions: {
        useTransaction: false,
      },
    });

    this.logger.info('Fee component activated successfully', {
      fee_id: id,
      component_name: fee.component_name,
      activated_by: activatedBy,
      previous_status: fee.status,
      new_status: FeeStatus.ACTIVE,
    });

    // TODO: Consider emitting an event here for fee update
    // this.eventEmitter.emit('fee.activated', id);
    await this.feeNotificationService.createAndUpdateFeesNotification(
      id,
      FeeNotificationType.ACTIVATED,
    );

    return updatedFee;
  }

  async getStudentsForFee(feeId: string): Promise<FeeStudentResponseDto[]> {
    const fee = await this.feesModelAction.getFeeWithStudentAssignments(feeId);

    if (!fee) {
      throw new NotFoundException(sysMsg.FEE_NOT_FOUND);
    }

    const studentMap = new Map<string, FeeStudentResponseDto>();

    if (fee.classes) {
      for (const cls of fee.classes) {
        if (cls.student_assignments) {
          for (const assignment of cls.student_assignments) {
            if (assignment.student && assignment.student.user) {
              const student = assignment.student;
              studentMap.set(student.id, {
                id: student.id,
                name: `${student.user.first_name} ${student.user.last_name}`,
                class: cls.name,
                session:
                  cls.academicSession?.academicYear ||
                  cls.academicSession?.name ||
                  '',
                registration_number: student.registration_number,
                photo_url: student.photo_url,
              });
            }
          }
        }
      }
    }

    if (fee.direct_assignments) {
      for (const assignment of fee.direct_assignments) {
        if (assignment.student && assignment.student.user) {
          const student = assignment.student;
          if (!studentMap.has(student.id)) {
            studentMap.set(student.id, {
              id: student.id,
              name: `${student.user.first_name} ${student.user.last_name}`,
              class: 'N/A',
              session: '',
              registration_number: student.registration_number,
              photo_url: student.photo_url,
            });
          }
        }
      }
    }

    return Array.from(studentMap.values());
  }

  async getActiveFeeComponents(query: GetActiveFeesDto): Promise<{
    data: FeeComponentResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page, limit } = query;
    const {
      fees,
      total,
      page: currentPage,
      limit: currentLimit,
      totalPages,
    } = await this.feesModelAction.getActiveFeeComponents(page, limit);

    const data = fees.map((fee) => ({
      id: fee.id,
      name: fee.component_name,
      amount: Number(fee.amount),
      session:
        fee.term?.academicSession?.academicYear ||
        fee.term?.academicSession?.name ||
        '',
      term: fee.term?.name || '',
      frequency: 'Per Term',
    }));

    return {
      data,
      total,
      page: currentPage,
      limit: currentLimit,
      totalPages,
    };
  }
}
