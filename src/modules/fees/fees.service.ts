import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource, In } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../constants/system.messages';
import { TermModelAction } from '../academic-term/model-actions';
import { ClassModelAction } from '../class/model-actions/class.actions';

import { CreateFeesDto, QueryFeesDto } from './dto/fees.dto';
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
    const queryBuilder = this.feesModelAction['repository']
      .createQueryBuilder('fee')
      .leftJoinAndSelect('fee.term', 'term')
      .leftJoinAndSelect('fee.classes', 'classes')
      .orderBy('fee.created_at', 'DESC');

    // Filter by status - default to ACTIVE if not specified
    if (status) {
      queryBuilder.andWhere('fee.status = :status', { status });
    } else {
      // Default to ACTIVE if no status is specified
      queryBuilder.andWhere('fee.status = :status', {
        status: FeeStatus.ACTIVE,
      });
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
}
