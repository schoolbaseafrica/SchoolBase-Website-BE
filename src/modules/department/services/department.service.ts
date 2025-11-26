import {
  ConflictException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { FindOptionsOrder } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../../constants/system.messages';
import { CreateDepartmentDto } from '../dto/create-department.dto';
import { DepartmentResponseDto } from '../dto/department-response.dto';
import { Department } from '../entities/department.entity';
import { DepartmentModelAction } from '../model-actions/department.actions';

export interface IListDepartmentsOptions {
  page?: number;
  limit?: number;
  order?: FindOptionsOrder<Department>;
}

export interface IBaseResponse<T> {
  status_code: number;
  message: string;
  data: T;
}

@Injectable()
export class DepartmentService {
  private readonly logger: Logger;

  constructor(
    private readonly departmentModelAction: DepartmentModelAction,
    @Inject(WINSTON_MODULE_PROVIDER) baseLogger: Logger,
  ) {
    this.logger = baseLogger.child({ context: DepartmentService.name });
  }

  //CREATE DEPARTMENT
  async create(
    createDepartmentDto: CreateDepartmentDto,
  ): Promise<IBaseResponse<DepartmentResponseDto>> {
    // Check if department with same name exists
    const existingDepartment = await this.departmentModelAction.get({
      identifierOptions: { name: createDepartmentDto.name },
    });

    if (existingDepartment) {
      throw new ConflictException(sysMsg.DEPARTMENT_ALREADY_EXISTS);
    }

    const newDepartment = await this.departmentModelAction.create({
      createPayload: {
        name: createDepartmentDto.name,
      },
      transactionOptions: {
        useTransaction: false,
      },
    });

    return {
      status_code: HttpStatus.CREATED,
      message: sysMsg.DEPARTMENT_CREATED,
      data: this.mapToResponseDto(newDepartment),
    };
  }

  private mapToResponseDto(department: Department): DepartmentResponseDto {
    return {
      id: department.id,
      name: department.name,
      created_at: department.createdAt,
      updated_at: department.updatedAt,
    };
  }
}
