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
import { CreateStudentDto, StudentResponseDto, PatchStudentDto } from '../dto';
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
        sysMsg.STUDENT_CREATED,
        savedStudent,
        savedUser,
      );
    });
  }

  findAll() {
    return `This action returns all term`;
  }

  findOne(id: string) {
    return `This action returns a #${id} term`;
  }

  async update(id: string, updateStudentDto: PatchStudentDto) {
    const existingStudent = await this.studentModelAction.get({
      identifierOptions: { id },
      relations: {
        user: true,
      },
    });
    if (!existingStudent) throw new NotFoundException(sysMsg.STUDENT_NOT_FOUND);
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
        sysMsg.STUDENT_UPDATED,
        student,
        updatedUser,
      );
    });
  }

  remove(id: string) {
    return `This action removes a #${id} term`;
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
