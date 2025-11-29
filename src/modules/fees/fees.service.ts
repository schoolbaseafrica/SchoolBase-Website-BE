import {
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource, In } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../constants/system.messages';
import { TermModelAction } from '../academic-term/model-actions';
import { ClassModelAction } from '../class/model-actions/class.actions';

import { CreateFeesDto, UpdateFeesDto } from './dto/fees.dto';
import { Fees } from './entities/fees.entity';
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
}
