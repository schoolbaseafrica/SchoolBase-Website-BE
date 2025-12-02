import {
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource, In, Repository } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../constants/system.messages';
import { TermModelAction } from '../academic-term/model-actions';
import { ClassModelAction } from '../class/model-actions/class.actions';

import { CreateFeesDto, QueryFeesDto, UpdateFeesDto } from './dto/fees.dto';
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
    private readonly dataSource: DataSource,
    @InjectRepository(Fees)
    private readonly feesRepository: Repository<Fees>,
    @Inject(WINSTON_MODULE_PROVIDER) logger: Logger,
  ) {
    this.logger = logger.child({ context: FeesService.name });
  }

  async create(createFeesDto: CreateFeesDto, createdBy: string): Promise<Fees> {
    return this.dataSource.transaction(async (manager) => {
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
          useTransaction: true,
          transaction: manager,
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
          useTransaction: true,
          transaction: manager,
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

      return savedFee;
    });
  }

  async findAll(queryDto: QueryFeesDto): Promise<{
    fees: Fees[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      status,
      class_id,
      term_id,
      search,
      page = 1,
      limit = 20,
    } = queryDto;

    const skip = (page - 1) * limit;

    // Use query builder for complex filtering, especially for many-to-many class relationship
    const queryBuilder = this.feesRepository
      .createQueryBuilder('fee')
      .leftJoinAndSelect('fee.term', 'term')
      .leftJoinAndSelect('fee.classes', 'classes')
      .orderBy('fee.createdAt', 'DESC');

    // Only filter by status if explicitly provided
    if (status) {
      queryBuilder.andWhere('fee.status = :status', { status });
    }

    // Filter by term_id
    if (term_id) {
      queryBuilder.andWhere('fee.term_id = :term_id', { term_id });
    }

    // Filter by class_id (many-to-many relationship)
    if (class_id) {
      queryBuilder.andWhere('classes.id = :class_id', { class_id });
    }

    // Search filter for component_name or description
    if (search && search.trim()) {
      queryBuilder.andWhere(
        '(fee.component_name ILIKE :search OR fee.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    const fees = await queryBuilder.skip(skip).take(limit).getMany();

    const totalPages = Math.ceil(total / limit);

    this.logger.info('Fetched fee components', {
      total,
      page,
      limit,
      filters: { status, class_id, term_id, search },
    });

    return {
      fees,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async update(id: string, updateFeesDto: UpdateFeesDto): Promise<Fees> {
    return this.dataSource.transaction(async (manager) => {
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
            useTransaction: true,
            transaction: manager,
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
          useTransaction: true,
          transaction: manager,
        },
      });

      this.logger.info('Fee component updated successfully', {
        fee_id: updatedFee.id,
        component_name: updatedFee.component_name,
        amount: updatedFee.amount,
        status: updatedFee.status,
      });

      return updatedFee;
    });
  }

  async findOne(id: string) {
    const existingFee = await this.feesModelAction.get({
      identifierOptions: { id },
      relations: { classes: true, term: true },
    });

    if (!existingFee) {
      throw new NotFoundException(sysMsg.FEE_NOT_FOUND);
    }

    return existingFee;
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

    return updatedFee;
  }
}
