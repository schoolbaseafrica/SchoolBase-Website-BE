import { PaginationMeta } from '@hng-sdk/orm';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource, IsNull, Like } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../../constants/system.messages';
import { UserRole } from '../../shared/enums';
import { FileService } from '../../shared/file/file.service';
import { hashPassword } from '../../shared/utils/password.util';
import { UserModelAction } from '../../user/model-actions/user-actions';
import {
  CreateStudentDto,
  StudentResponseDto,
  ListStudentsDto,
  PatchStudentDto,
} from '../dto';
import { Student } from '../entities';
import { StudentModelAction } from '../model-actions';

@Injectable()
export class StudentService {
  private readonly logger: Logger;
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) baseLogger: Logger,
    private readonly userModelAction: UserModelAction,
    private readonly studentModelAction: StudentModelAction,
    private readonly dataSource: DataSource,
    private readonly fileService: FileService,
  ) {
    this.logger = baseLogger.child({ context: StudentService.name });
  }

  async create(
    createStudentDto: CreateStudentDto,
  ): Promise<StudentResponseDto> {
    const existingUser = await this.userModelAction.get({
      identifierOptions: { email: createStudentDto.email },
    });

    if (existingUser) {
      this.logger.warn(
        `Attempt to create student with existing email: ${createStudentDto.email}`,
      );
      throw new ConflictException(sysMsg.STUDENT_EMAIL_CONFLICT);
    }
    const registration_number =
      createStudentDto.registration_number ||
      (await this.generateStudentNumber());

    const existingStudent = await this.studentModelAction.get({
      identifierOptions: { registration_number },
    });

    if (existingStudent) {
      this.logger.warn(
        `Attempt to create student with existing registration number: ${registration_number}`,
      );
      throw new ConflictException(sysMsg.STUDENT_REGISTRATION_NUMBER_CONFLICT);
    }

    const hashedPassword = await hashPassword(createStudentDto.password);

    let photo_url: string | undefined = undefined;
    if (createStudentDto.photo_url) {
      photo_url = this.fileService.validatePhotoUrl(createStudentDto.photo_url);
    }

    return this.dataSource.transaction(async (manager) => {
      const savedUser = await this.userModelAction.create({
        createPayload: {
          first_name: createStudentDto.first_name,
          last_name: createStudentDto.last_name,
          middle_name: createStudentDto.middle_name,
          email: createStudentDto.email,
          phone: createStudentDto.phone,
          gender: createStudentDto.gender,
          dob: new Date(createStudentDto.date_of_birth),
          homeAddress: createStudentDto.home_address,
          password: hashedPassword,
          role: [UserRole.STUDENT],
          is_active: createStudentDto.is_active ?? true,
        },
        transactionOptions: {
          useTransaction: true,
          transaction: manager,
        },
      });

      const savedStudent = await this.studentModelAction.create({
        createPayload: {
          user: { id: savedUser.id },
          registration_number,
          photo_url: photo_url,
        },
        transactionOptions: {
          useTransaction: true,
          transaction: manager,
        },
      });

      this.logger.info(sysMsg.RESOURCE_CREATED, {
        studentId: savedStudent.id,
        registration_number,
        email: savedUser.email,
      });

      return new StudentResponseDto(
        savedStudent,
        savedUser,
        sysMsg.STUDENT_CREATED,
      );
    });
  }

  // --- FIND ALL (with pagination and search) ---
  async findAll(listStudentsDto: ListStudentsDto): Promise<{
    message: string;
    status_code: number;
    data: StudentResponseDto[];
    meta: Partial<PaginationMeta>;
  }> {
    const { page = 1, limit = 10, search } = listStudentsDto;

    // Use the custom search method for search, regular list for no search
    const { payload: students, paginationMeta } = search
      ? await this.searchStudentsWithModelAction(search, page, limit)
      : await this.studentModelAction.list({
          filterRecordOptions: {
            deleted_at: IsNull(),
          },
          relations: { user: true, stream: true },
          paginationPayload: { page, limit },
          order: { createdAt: 'DESC' },
        });

    const data = students.map(
      (student) => new StudentResponseDto(student, student.user),
    );

    this.logger.info(`Fetched ${data.length} students`, {
      searchTerm: search,
      page,
      limit,
      total: paginationMeta.total,
    });

    return {
      message: sysMsg.STUDENTS_FETCHED,
      status_code: 200,
      data,
      meta: paginationMeta,
    };
  }

  // --- FIND ONE ---
  async findOne(id: string): Promise<StudentResponseDto> {
    const student = await this.studentModelAction.get({
      identifierOptions: { id },
      relations: { user: true, stream: true },
    });

    if (!student || student.deleted_at) {
      this.logger.warn(`Student not found with ID: ${id}`);
      throw new NotFoundException(sysMsg.STUDENT_NOT_FOUND);
    }

    return new StudentResponseDto(
      student,
      student.user,
      sysMsg.STUDENT_FETCHED,
    );
  }

  async update(
    id: string,
    updateStudentDto: PatchStudentDto,
  ): Promise<StudentResponseDto> {
    const existingStudent = await this.studentModelAction.get({
      identifierOptions: { id },
      relations: {
        user: true,
      },
    });
    if (!existingStudent || existingStudent.deleted_at)
      throw new NotFoundException(sysMsg.STUDENT_NOT_FOUND);
    if (updateStudentDto.email) {
      const existingUser = await this.userModelAction.get({
        identifierOptions: { email: updateStudentDto.email },
      });

      if (existingUser && existingUser.id !== existingStudent.user.id) {
        this.logger.warn(
          `Attempt to update student with existing email: ${updateStudentDto.email}`,
        );
        throw new ConflictException(sysMsg.STUDENT_EMAIL_CONFLICT);
      }
    }
    return this.dataSource.transaction(async (manager) => {
      const updatedUser = await this.userModelAction.update({
        identifierOptions: { id: existingStudent.user.id },
        updatePayload: {
          first_name: updateStudentDto.first_name,
          last_name: updateStudentDto.last_name,
          middle_name: updateStudentDto.middle_name,
          email: updateStudentDto.email,
          phone: updateStudentDto.phone,
          gender: updateStudentDto.gender,
          dob: updateStudentDto.date_of_birth
            ? new Date(updateStudentDto.date_of_birth)
            : undefined,
          homeAddress: updateStudentDto.home_address,
        },
        transactionOptions: {
          useTransaction: true,
          transaction: manager,
        },
      });

      let student = existingStudent;

      if (updateStudentDto.photo_url) {
        const photo_url = this.fileService.validatePhotoUrl(
          updateStudentDto.photo_url,
        );
        student = await this.studentModelAction.update({
          identifierOptions: { id },
          updatePayload: {
            photo_url: photo_url,
          },
          transactionOptions: {
            useTransaction: true,
            transaction: manager,
          },
        });
      }

      this.logger.info(sysMsg.RESOURCE_UPDATED, {
        studentId: id,
      });

      return new StudentResponseDto(
        student,
        updatedUser,
        sysMsg.STUDENT_UPDATED,
      );
    });
  }

  async remove(id: string) {
    const existingStudent = await this.studentModelAction.get({
      identifierOptions: { id },
      relations: {
        user: true,
      },
    });
    if (!existingStudent || existingStudent.deleted_at)
      throw new NotFoundException(sysMsg.STUDENT_NOT_FOUND);
    return this.dataSource.transaction(async (manager) => {
      await this.userModelAction.update({
        identifierOptions: { id: existingStudent.user.id },
        updatePayload: {
          deleted_at: new Date(),
          is_active: false,
        },
        transactionOptions: {
          useTransaction: true,
          transaction: manager,
        },
      });

      await this.studentModelAction.update({
        identifierOptions: { id },
        updatePayload: {
          deleted_at: new Date(),
        },
        transactionOptions: {
          useTransaction: true,
          transaction: manager,
        },
      });

      this.logger.info(sysMsg.RESOURCE_UPDATED, {
        studentId: id,
      });

      return { message: sysMsg.STUDENT_DELETED };
    });
  }

  // --- SEARCH STUDENTS (private method) ---
  private async searchStudentsWithModelAction(
    search: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    payload: Student[];
    paginationMeta: Partial<PaginationMeta>;
  }> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.studentModelAction['repository']
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('student.stream', 'stream')
      .orderBy('student.createdAt', 'DESC')
      .where('student.deleted_at IS NULL');

    if (search && search.trim()) {
      queryBuilder.andWhere(
        '(user.first_name ILIKE :search OR user.last_name ILIKE :search OR user.email ILIKE :search OR student.registration_number ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const total = await queryBuilder.getCount();
    const payload = await queryBuilder.skip(skip).take(limit).getMany();

    const paginationMeta = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return { payload, paginationMeta };
  }

  /**
   * Generate a unique Student Number in the format STU-YYYY-XXXX
   * where YYYY is the current year and XXXX is a 4-digit sequential number.
   */
  private async generateStudentNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const yearPrefix = `STU-${currentYear}-`;

    // Fetch the last student number for this year
    const lastRecord = await this.studentModelAction.find({
      findOptions: {
        registration_number: Like(`${yearPrefix}%`),
      },
      transactionOptions: { useTransaction: false },
      paginationPayload: { limit: 1, page: 1 },
      order: { registration_number: 'DESC' },
    });

    let nextSequence = 1;

    if (lastRecord?.payload?.length > 0) {
      const lastStudentNumber = lastRecord.payload[0].registration_number;

      if (lastStudentNumber) {
        const parts = lastStudentNumber.split('-');
        if (parts.length === 3) {
          const lastSeq = parseInt(parts[2], 10);
          if (!isNaN(lastSeq)) {
            nextSequence = lastSeq + 1;
          }
        }
      }
    }

    const sequenceStr = String(nextSequence).padStart(4, '0');
    return `${yearPrefix}${sequenceStr}`;
  }
}
