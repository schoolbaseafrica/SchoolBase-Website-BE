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

import { FeeStudentResponseDto } from './dto/fee-students-response.dto';
import { CreateFeesDto, QueryFeesDto, UpdateFeesDto } from './dto/fees.dto';
import { FeeAssignment } from './entities/fee-assignment.entity';
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
    @InjectRepository(FeeAssignment)
    private readonly feeAssignmentRepository: Repository<FeeAssignment>,
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
      .leftJoin('fee.createdBy', 'createdBy')
      .addSelect([
        'createdBy.id',
        'createdBy.first_name',
        'createdBy.last_name',
        'createdBy.middle_name',
      ])
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

  async getStudentsForFee(feeId: string): Promise<FeeStudentResponseDto[]> {
    const fee = await this.feesRepository.findOne({
      where: { id: feeId },
      relations: [
        'classes',
        'classes.student_assignments',
        'classes.student_assignments.student',
        'classes.student_assignments.student.user',
        'classes.academicSession',
        'direct_assignments',
        'direct_assignments.student',
        'direct_assignments.student.user',
      ],
    });

    if (!fee) {
      throw new NotFoundException(sysMsg.FEE_NOT_FOUND);
    }

    const studentMap = new Map<string, FeeStudentResponseDto>();

    // Process class assignments
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

    // Process direct assignments
    if (fee.direct_assignments) {
      for (const assignment of fee.direct_assignments) {
        if (assignment.student && assignment.student.user) {
          const student = assignment.student;
          // Direct assignment might override class info or be standalone
          // If already exists, we keep the class info (or update if needed? Requirement says "associated with classes linked... or direct assignments")
          // If it's a direct assignment, it might not have a class context in this fee's context, but the student belongs to a class generally.
          // However, the requirement asks for "class". If direct assignment, we might need to fetch their current class separately if not already in the map.
          // But for now, let's assume if they are in the map, we keep them. If not, we add them.
          // If added via direct assignment, "class" might be ambiguous if they are not in one of the linked classes.
          // Let's check if we have class info. If not, we might leave it empty or fetch it.
          // For simplicity and performance, if they are not in the map (meaning not in a linked class), we add them.
          if (!studentMap.has(student.id)) {
            studentMap.set(student.id, {
              id: student.id,
              name: `${student.user.first_name} ${student.user.last_name}`,
              class: 'N/A', // Or fetch their primary class if possible, but that requires more queries.
              session: '', // Same here
              registration_number: student.registration_number,
              photo_url: student.photo_url,
            });
          }
        }
      }
    }

    return Array.from(studentMap.values());
  }
}
