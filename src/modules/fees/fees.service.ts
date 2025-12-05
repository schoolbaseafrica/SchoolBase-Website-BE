import {
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource, In } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../constants/system.messages';
import { TermModelAction } from '../academic-term/model-actions';
import { ClassModelAction } from '../class/model-actions/class.actions';
import { PaymentService } from '../payment/services/payment.service';
import { StudentModelAction } from '../student/model-actions/student-actions';

import { FeeComponentResponseDto } from './dto/fee-component-response.dto';
import { FeeStudentResponseDto } from './dto/fee-students-response.dto';
import { CreateFeesDto, QueryFeesDto, UpdateFeesDto } from './dto/fees.dto';
import { GetActiveFeesDto } from './dto/get-active-fees.dto';
import { StudentFeeDetailsResponseDto } from './dto/student-fee-details.dto';
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
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
    private readonly studentModelAction: StudentModelAction,
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
  async getStudentFeeDetails(
    studentId: string,
    termId: string,
    sessionId: string,
  ): Promise<StudentFeeDetailsResponseDto> {
    const student = await this.studentModelAction.get({
      identifierOptions: { id: studentId },
      relations: {
        user: true,
        class_assignments: { class: { academicSession: true } },
        stream: true,
      },
    });

    if (!student) {
      throw new NotFoundException(sysMsg.STUDENT_NOT_FOUND);
    }

    const term = await this.termModelAction.get({
      identifierOptions: { id: termId },
      relations: { academicSession: true },
    });

    if (!term) {
      throw new BadRequestException(sysMsg.TERM_ID_INVALID);
    }

    if (term.academicSession?.id !== sessionId) {
      throw new BadRequestException(
        'Term does not belong to the specified session',
      );
    }

    const currentClassAssignment = student.class_assignments?.[0];
    const currentClass = currentClassAssignment?.class;

    const fees = await this.feesModelAction.getFeesForStudent(
      studentId,
      currentClass?.id,
      termId,
    );

    const { payments } = await this.paymentService.fetchAllPayments({
      student_id: studentId,
      term_id: termId,
      limit: 1000,
    });

    const feeBreakdown = fees.map((fee) => {
      const paidForComponent = payments
        .filter((p) => p.fee_component_id === fee.id)
        .reduce((sum, p) => sum + Number(p.amount_paid), 0);

      const amount = Number(fee.amount);
      const outstanding = amount - paidForComponent;

      let status: 'PAID' | 'PARTIALLY_PAID' | 'OUTSTANDING' = 'OUTSTANDING';
      if (outstanding <= 0) {
        status = 'PAID';
      } else if (paidForComponent > 0) {
        status = 'PARTIALLY_PAID';
      }

      return {
        component_name: fee.component_name,
        amount: amount,
        amount_paid: paidForComponent,
        outstanding_amount: Math.max(0, outstanding),
        status,
      };
    });

    return {
      student_info: {
        student_id: student.id,
        first_name: student.user.first_name,
        last_name: student.user.last_name,
        registration_number: student.registration_number,
        class: currentClass?.name || 'N/A',
        term: term.name,
        session: term.academicSession?.academicYear || '',
      },
      fee_breakdown: feeBreakdown,
      payment_history: payments.map((p) => ({
        payment_date: p.payment_date,
        amount_paid: Number(p.amount_paid),
        payment_method: p.payment_method,
        transaction_reference: p.transaction_id || p.invoice_number || 'N/A',
        fee_component: p.fee_component?.component_name || 'Unknown',
        term_label: p.term?.name || term.name || 'Unknown Term',
      })),
    };
  }
}
