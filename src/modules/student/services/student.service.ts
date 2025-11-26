import { PaginationMeta } from '@hng-sdk/orm';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource, Like } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../../constants/system.messages';
import { UserRole } from '../../shared/enums';
import { FileService } from '../../shared/file/file.service';
import { hashPassword } from '../../shared/utils/password.util';
import { UserModelAction } from '../../user/model-actions/user-actions';
import {
  CreateStudentDto,
  UpdateStudentDto,
  StudentResponseDto,
  ListStudentsDto,
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

  async create(createStudentDto: CreateStudentDto) {
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
      (await this.generateRegistrationNumber());

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
          registration_number: registration_number,
          photo_url: photo_url,
        },
        transactionOptions: {
          useTransaction: true,
          transaction: manager,
        },
      });

      this.logger.info(sysMsg.RESOURCE_CREATED, {
        studentId: savedStudent.id,
        registration_number: savedStudent.registration_number,
        email: savedUser.email,
      });

      return new StudentResponseDto(
        sysMsg.STUDENT_CREATED,
        savedStudent,
        savedUser,
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
          relations: { user: true, stream: true },
          paginationPayload: { page, limit },
          order: { createdAt: 'DESC' },
        });

    const data = students.map(
      (student) => new StudentResponseDto('', student, student.user),
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
  async findOne(id: string): Promise<{
    message: string;
    status_code: number;
    data: StudentResponseDto;
  }> {
    const student = await this.studentModelAction.get({
      identifierOptions: { id },
      relations: { user: true, stream: true },
    });

    if (!student) {
      this.logger.warn(`Student not found with ID: ${id}`);
      throw new NotFoundException(sysMsg.STUDENT_NOT_FOUND);
    }

    const data = new StudentResponseDto('', student, student.user);

    return {
      message: sysMsg.STUDENT_FETCHED,
      status_code: 200,
      data,
    };
  }

  update(id: string, updateStudentDto: UpdateStudentDto) {
    return `#${id}: ${updateStudentDto}`;
  }

  remove(id: string) {
    return `This action removes a #${id} term`;
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
      .orderBy('student.createdAt', 'DESC');

    if (search) {
      queryBuilder.where(
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
   * Generate a unique Registration Number in the format REG-YYYY-XXX
   * where YYYY is the current year and XXX is a sequential number (001, 002, etc.)
   */
  private async generateRegistrationNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const yearPrefix = `REG-${currentYear}-`;

    // Query the highest existing sequential number for the current year
    const lastStudent = await this.studentModelAction.find({
      findOptions: {
        registration_number: Like(`${yearPrefix}%`),
      },
      transactionOptions: {
        useTransaction: false,
      },
      paginationPayload: { limit: 1, page: 1 },
      order: { registration_number: 'DESC' },
    });

    let nextSequence = 1;
    if (lastStudent) {
      // Extract the numeric part (e.g., '014' from 'REG-2025-014')
      const parts = lastStudent.payload[0].registration_number.split('-');
      if (parts.length === 3) {
        const lastId = parts[2];
        nextSequence = parseInt(lastId, 10) + 1;
      }
    }

    // Format the sequence number to be 3 digits (e.g., 1 -> 001, 14 -> 014)
    const sequenceStr = nextSequence.toString().padStart(3, '0');
    return `${yearPrefix}${sequenceStr}`;
  }
}
