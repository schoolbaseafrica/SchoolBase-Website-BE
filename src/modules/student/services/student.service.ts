import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../../constants/system.messages';
import { UserRole } from '../../shared/enums';
import { FileService } from '../../shared/file/file.service';
import {
  generateStrongPassword,
  hashPassword,
} from '../../shared/utils/password.util';
import { UserModelAction } from '../../user/model-actions/user-actions';
import { CreateStudentDto, UpdateStudentDto, StudentResponseDto } from '../dto';
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
      (await this.studentModelAction.generateRegistrationNumber());

    const existingStudent = await this.studentModelAction.get({
      identifierOptions: { registration_number },
    });

    if (existingStudent) {
      this.logger.warn(
        `Attempt to create student with existing registration number: ${registration_number}`,
      );
      throw new ConflictException(sysMsg.STUDENT_REGISTRATION_NUMBER_CONFLICT);
    }

    const rawPassword = createStudentDto.password || generateStrongPassword(12);
    const hashedPassword = await hashPassword(rawPassword);

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
        teacherId: savedStudent.id,
        registration_number: savedStudent.registration_number,
        email: savedUser.email,
      });

      return new StudentResponseDto(savedStudent, savedUser);
    });
  }

  findAll() {
    return `This action returns all term`;
  }

  findOne(id: string) {
    return `This action returns a #${id} term`;
  }

  update(id: string, updateStudentDto: UpdateStudentDto) {
    return `#${id}: ${updateStudentDto}`;
  }

  remove(id: string) {
    return `This action removes a #${id} term`;
  }
}
