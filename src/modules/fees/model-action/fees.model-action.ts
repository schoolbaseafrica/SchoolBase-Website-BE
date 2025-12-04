import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { QueryFeesDto } from '../dto/fees.dto';
import { Fees } from '../entities/fees.entity';

@Injectable()
export class FeesModelAction extends AbstractModelAction<Fees> {
  constructor(
    @InjectRepository(Fees)
    private readonly feeRepository: Repository<Fees>,
  ) {
    super(feeRepository, Fees);
  }
  async getFeeWithStudentAssignments(feeId: string): Promise<Fees | null> {
    return this.feeRepository
      .createQueryBuilder('fee')
      .leftJoinAndSelect('fee.classes', 'classes')
      .leftJoinAndSelect('classes.student_assignments', 'class_assignments')
      .leftJoinAndSelect('class_assignments.student', 'class_student')
      .leftJoinAndSelect('class_student.user', 'class_student_user')
      .leftJoinAndSelect('classes.academicSession', 'academicSession')
      .leftJoinAndSelect('fee.direct_assignments', 'direct_assignments')
      .leftJoinAndSelect('direct_assignments.student', 'direct_student')
      .leftJoinAndSelect('direct_student.user', 'direct_student_user')
      .where('fee.id = :feeId', { feeId })
      .getOne();
  }

  async findAllFees(queryDto: QueryFeesDto): Promise<{
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

    const queryBuilder = this.feeRepository
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

    if (status) {
      queryBuilder.andWhere('fee.status = :status', { status });
    }

    if (term_id) {
      queryBuilder.andWhere('fee.term_id = :term_id', { term_id });
    }

    if (class_id) {
      queryBuilder.andWhere('classes.id = :class_id', { class_id });
    }

    if (search && search.trim()) {
      queryBuilder.andWhere(
        '(fee.component_name ILIKE :search OR fee.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const total = await queryBuilder.getCount();
    const fees = await queryBuilder.skip(skip).take(limit).getMany();
    const totalPages = Math.ceil(total / limit);

    return {
      fees,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
