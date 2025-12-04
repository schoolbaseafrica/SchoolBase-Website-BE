import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource } from 'typeorm';
import { Logger } from 'winston';

import { IPaginationMeta } from '../../common/types/base-response.interface';
import * as sysMsg from '../../constants/system.messages';
import { ClassStudentModelAction } from '../class/model-actions/class-student.action';
import { ClassSubjectModelAction } from '../class/model-actions/class-subject.action';
import { UserRole } from '../shared/enums';
import { FileService } from '../shared/file/file.service';
import {
  generateStrongPassword,
  hashPassword,
} from '../shared/utils/password.util';
import { StudentModelAction } from '../student/model-actions/student-actions';
import { User } from '../user/entities/user.entity';
import { UserModelAction } from '../user/model-actions/user-actions';

import {
  CreateParentDto,
  LinkStudentsDto,
  ListParentsDto,
  ParentResponseDto,
  ParentStudentLinkResponseDto,
  StudentBasicDto,
  UpdateParentDto,
  StudentSubjectResponseDto,
} from './dto';
import { Parent } from './entities/parent.entity';
import { ParentModelAction } from './model-actions/parent-actions';

export interface IUserPayload {
  id: string;
  email: string;
  roles: string[];
}

@Injectable()
export class ParentService {
  private readonly logger: Logger;
  constructor(
    private readonly parentModelAction: ParentModelAction,
    private readonly userModelAction: UserModelAction,
    private readonly studentModelAction: StudentModelAction,
    private readonly classStudentModelAction: ClassStudentModelAction,
    private readonly classSubjectModelAction: ClassSubjectModelAction,
    private readonly dataSource: DataSource,
    private readonly fileService: FileService,
    @Inject(WINSTON_MODULE_PROVIDER) baseLogger: Logger,
  ) {
    this.logger = baseLogger.child({ context: ParentService.name });
  }

  // --- CREATE ---
  async create(createDto: CreateParentDto): Promise<ParentResponseDto> {
    // 1. Check for existing user with email
    const existingUser = await this.userModelAction.get({
      identifierOptions: { email: createDto.email },
    });
    if (existingUser) {
      this.logger.warn(
        `Attempt to create parent with existing email: ${createDto.email}`,
      );
      throw new ConflictException(
        `User with email ${createDto.email} already exists.`,
      );
    }

    const rawPassword = createDto.password || generateStrongPassword(12);
    const hashedPassword = await hashPassword(rawPassword);

    const middleNameForDb =
      createDto.middle_name === '' ? null : createDto.middle_name;
    // 3. Validate Photo URL if provided
    let photo_url: string | undefined = undefined;
    if (createDto.photo_url) {
      photo_url = this.fileService.validatePhotoUrl(createDto.photo_url);
    }

    return this.dataSource.transaction(async (manager) => {
      // 4. Create User using model action within transaction
      const savedUser = await this.userModelAction.create({
        createPayload: {
          first_name: createDto.first_name,
          last_name: createDto.last_name,
          middle_name: middleNameForDb,
          email: createDto.email,
          phone: createDto.phone,
          gender: createDto.gender,
          dob: new Date(createDto.date_of_birth),
          homeAddress: createDto.home_address,
          password: hashedPassword,
          role: [UserRole.PARENT],
          is_active: createDto.is_active ?? true,
        },
        transactionOptions: {
          useTransaction: true,
          transaction: manager,
        },
      });

      // 5. Create Parent using model action within transaction
      const savedParent = await this.parentModelAction.create({
        createPayload: {
          user_id: savedUser.id,
          photo_url: photo_url,
          is_active: createDto.is_active ?? true,
        },
        transactionOptions: {
          useTransaction: true,
          transaction: manager,
        },
      });

      // 6. Return response (Transform User/Parent entities into DTO)
      const response = {
        ...savedParent,
        first_name: savedUser.first_name,
        last_name: savedUser.last_name,
        middle_name: savedUser.middle_name,
        email: savedUser.email,
        phone: savedUser.phone,
        gender: savedUser.gender,
        date_of_birth: savedUser.dob,
        home_address: savedUser.homeAddress,
        is_active: savedParent.is_active,
        photo_url: savedParent.photo_url,
        created_at: savedParent.createdAt,
        updated_at: savedParent.updatedAt,
      };

      this.logger.info(sysMsg.RESOURCE_CREATED, {
        parentId: savedParent.id,
        email: savedUser.email,
      });

      return plainToInstance(ParentResponseDto, response, {
        excludeExtraneousValues: true,
      });
    });
  }

  async findAll(listParentsDto: ListParentsDto): Promise<{
    data: ParentResponseDto[];
    paginationMeta: Partial<IPaginationMeta>;
  }> {
    const { page = 1, limit = 10, search } = listParentsDto;

    // Using query builder to ensure deleted_at filtering works correctly
    const result = await this.searchParentsWithModelAction(
      search || '',
      page,
      limit,
    );

    const data = result.payload.map((parent) =>
      this.transformToParentResponseDto(parent),
    );

    this.logger.info(`Fetched ${data.length} parents`, {
      searchTerm: search,
      page,
      limit,
      total: result.paginationMeta.total,
    });

    return { data, paginationMeta: result.paginationMeta };
  }
  async findOne(id: string): Promise<ParentResponseDto> {
    const parent = await this.parentModelAction.get({
      identifierOptions: { id },
      relations: { user: true },
    });

    if (!parent || parent.deleted_at) {
      this.logger.warn(`Parent not found with ID: ${id}`);
      throw new NotFoundException(sysMsg.PARENT_NOT_FOUND);
    }

    return this.transformToParentResponseDto(parent);
  }

  // --- UPDATE ---
  async update(
    id: string,
    updateDto: UpdateParentDto,
  ): Promise<ParentResponseDto> {
    const parent = await this.parentModelAction.get({
      identifierOptions: { id },
      relations: { user: true },
    });

    if (!parent || parent.deleted_at) {
      this.logger.warn(`Parent not found with ID: ${id}`);
      throw new NotFoundException(sysMsg.PARENT_NOT_FOUND);
    }

    // Check for email conflict if email is being updated
    if (updateDto.email && updateDto.email !== parent.user.email) {
      const existingUser = await this.userModelAction.get({
        identifierOptions: { email: updateDto.email },
      });
      if (existingUser && existingUser.id !== parent.user_id) {
        this.logger.warn(
          `Attempt to update parent email to existing email: ${updateDto.email}`,
        );
        throw new ConflictException(
          `User with email ${updateDto.email} already exists.`,
        );
      }
    }

    // Prepare update payloads
    const userUpdatePayload: Partial<User> = {};
    if (updateDto.first_name !== undefined)
      userUpdatePayload.first_name = updateDto.first_name;
    if (updateDto.last_name !== undefined)
      userUpdatePayload.last_name = updateDto.last_name;
    if (updateDto.middle_name !== undefined)
      userUpdatePayload.middle_name = updateDto.middle_name;
    if (updateDto.email !== undefined)
      userUpdatePayload.email = updateDto.email;
    if (updateDto.phone !== undefined)
      userUpdatePayload.phone = updateDto.phone;
    if (updateDto.gender !== undefined)
      userUpdatePayload.gender = updateDto.gender;
    if (updateDto.date_of_birth !== undefined)
      userUpdatePayload.dob = new Date(updateDto.date_of_birth);
    if (updateDto.home_address !== undefined)
      userUpdatePayload.homeAddress = updateDto.home_address;
    if (updateDto.is_active !== undefined)
      userUpdatePayload.is_active = updateDto.is_active;

    const parentUpdatePayload: Partial<Parent> = {};
    if (updateDto.is_active !== undefined)
      parentUpdatePayload.is_active = updateDto.is_active;

    // Handle Photo URL Update
    if (updateDto.photo_url !== undefined) {
      parentUpdatePayload.photo_url = updateDto.photo_url
        ? this.fileService.validatePhotoUrl(updateDto.photo_url)
        : null;
    }

    return this.dataSource.transaction(async (manager) => {
      // Update User Data using model action within transaction
      const updatedUser = await this.userModelAction.update({
        identifierOptions: { id: parent.user_id },
        updatePayload: userUpdatePayload,
        transactionOptions: {
          useTransaction: true,
          transaction: manager,
        },
      });

      // Update Parent Data using model action within transaction
      const updatedParent = await this.parentModelAction.update({
        identifierOptions: { id },
        updatePayload: parentUpdatePayload,
        transactionOptions: {
          useTransaction: true,
          transaction: manager,
        },
      });

      // Return response
      const response = {
        ...updatedParent,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        middle_name: updatedUser.middle_name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        gender: updatedUser.gender,
        date_of_birth: updatedUser.dob,
        home_address: updatedUser.homeAddress,
        is_active: updatedParent.is_active,
        photo_url: updatedParent.photo_url,
        created_at: updatedParent.createdAt,
        updated_at: updatedParent.updatedAt,
      };

      this.logger.info(sysMsg.PARENT_UPDATED, {
        parentId: id,
        email: updatedUser.email,
      });

      return plainToInstance(ParentResponseDto, response, {
        excludeExtraneousValues: true,
      });
    });
  }

  // --- DELETE (Soft Delete) ---
  async remove(id: string): Promise<void> {
    const parent = await this.parentModelAction.get({
      identifierOptions: { id },
      relations: { user: true },
    });

    if (!parent || parent.deleted_at) {
      this.logger.warn(`Parent not found with ID: ${id}`);
      throw new NotFoundException(sysMsg.PARENT_NOT_FOUND);
    }

    return this.dataSource.transaction(async (manager) => {
      // Set deleted_at and is_active to false within transaction
      await this.parentModelAction.update({
        identifierOptions: { id },
        updatePayload: {
          deleted_at: new Date(),
          is_active: false,
        },
        transactionOptions: {
          useTransaction: true,
          transaction: manager,
        },
      });

      // Also deactivate the associated user account within transaction
      await this.userModelAction.update({
        identifierOptions: { id: parent.user_id },
        updatePayload: { is_active: false },
        transactionOptions: {
          useTransaction: true,
          transaction: manager,
        },
      });

      this.logger.info(sysMsg.PARENT_DELETED, {
        parentId: id,
        userId: parent.user_id,
      });
    });
  }

  // --- GET STUDENT SUBJECTS ---
  async getStudentSubjects(
    studentId: string,
    user: IUserPayload,
  ): Promise<StudentSubjectResponseDto[]> {
    const isAdmin = user.roles.includes(UserRole.ADMIN);
    let parentId: string;

    if (!isAdmin) {
      const parent = await this.parentModelAction.get({
        identifierOptions: { user_id: user.id },
      });

      if (!parent) {
        throw new NotFoundException(sysMsg.PARENT_PROFILE_NOT_FOUND);
      }
      parentId = parent.id;
    }

    if (!isAdmin) {
      const student = await this.studentModelAction.get({
        identifierOptions: { id: studentId, parent: { id: parentId } },
      });

      if (!student) {
        throw new NotFoundException(sysMsg.STUDENT_NOT_BELONG_TO_PARENT);
      }
    }

    const classStudent = await this.classStudentModelAction.get({
      identifierOptions: { student: { id: studentId }, is_active: true },
      relations: { class: true },
    });

    if (!classStudent) {
      this.logger.warn(
        `Student ${studentId} is not assigned to any active class`,
      );
      return [];
    }

    const classId = classStudent.class.id;

    const classSubjectsList = await this.classSubjectModelAction[
      'repository'
    ].find({
      where: { class: { id: classId } },
      relations: ['subject', 'teacher', 'teacher.user'],
    });

    return classSubjectsList.map((cs) => {
      const teacherUser = cs.teacher?.user;
      return plainToInstance(
        StudentSubjectResponseDto,
        {
          subject_name: cs.subject.name,
          teacher_name: teacherUser
            ? `${teacherUser.first_name} ${teacherUser.last_name}`
            : 'Not Assigned',
          teacher_email: teacherUser ? teacherUser.email : 'N/A',
        },
        { excludeExtraneousValues: true },
      );
    });
  }

  // --- HELPER METHOD TO TRANSFORM ENTITY TO DTO ---
  private transformToParentResponseDto(parent: Parent): ParentResponseDto {
    const { user } = parent;

    if (!user) {
      throw new Error('User relation not loaded for parent');
    }

    const response = {
      id: parent.id,
      first_name: user.first_name,
      last_name: user.last_name,
      middle_name: user.middle_name,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      date_of_birth: user.dob,
      home_address: user.homeAddress,
      is_active: parent.is_active,
      photo_url: parent.photo_url,
      created_at: parent.createdAt,
      updated_at: parent.updatedAt,
    };

    return plainToInstance(ParentResponseDto, response, {
      excludeExtraneousValues: true,
    });
  }
  private async searchParentsWithModelAction(
    search: string | undefined,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    payload: Parent[];
    paginationMeta: Partial<IPaginationMeta>;
  }> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.parentModelAction['repository']
      .createQueryBuilder('parent')
      .leftJoinAndSelect('parent.user', 'user')
      .where('parent.deleted_at IS NULL')
      .orderBy('parent.createdAt', 'DESC');

    if (search && search.trim()) {
      queryBuilder.andWhere(
        '(user.first_name ILIKE :search OR user.last_name ILIKE :search OR user.email ILIKE :search)',
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

  // --- LINK STUDENTS TO PARENT ---
  async linkStudentsToParent(
    parentId: string,
    linkDto: LinkStudentsDto,
  ): Promise<ParentStudentLinkResponseDto> {
    // 1. Validate parent exists and is not deleted
    const parent = await this.parentModelAction.get({
      identifierOptions: { id: parentId },
    });

    if (!parent || parent.deleted_at) {
      this.logger.warn(`Parent not found with ID: ${parentId}`);
      throw new NotFoundException(sysMsg.PARENT_NOT_FOUND);
    }

    // 2. Validate all students exist and are not deleted
    const students = await Promise.all(
      linkDto.student_ids.map(async (studentId) => {
        const student = await this.studentModelAction.get({
          identifierOptions: { id: studentId },
        });

        if (!student || student.is_deleted) {
          this.logger.warn(`Student not found with ID: ${studentId}`);
          throw new NotFoundException(`Student with ID ${studentId} not found`);
        }

        return student;
      }),
    );

    // 3. Link students to parent in a transaction
    await this.dataSource.transaction(async (manager) => {
      for (const student of students) {
        await this.studentModelAction.update({
          identifierOptions: { id: student.id },
          updatePayload: {
            parent: { id: parentId },
          },
          transactionOptions: {
            useTransaction: true,
            transaction: manager,
          },
        });
      }
    });

    this.logger.info(sysMsg.STUDENTS_LINKED_TO_PARENT, {
      parentId,
      studentIds: linkDto.student_ids,
      totalLinked: linkDto.student_ids.length,
    });

    // 4. Return response
    return plainToInstance(
      ParentStudentLinkResponseDto,
      {
        parent_id: parentId,
        linked_students: linkDto.student_ids,
        total_linked: linkDto.student_ids.length,
      },
      { excludeExtraneousValues: true },
    );
  }

  // --- GET LINKED STUDENTS (ADMIN VERSION) ---
  async getLinkedStudents(parentId: string): Promise<StudentBasicDto[]> {
    // 1. Validate parent exists and is not deleted
    const parent = await this.parentModelAction.get({
      identifierOptions: { id: parentId },
    });

    if (!parent || parent.deleted_at) {
      this.logger.warn(`Parent not found with ID: ${parentId}`);
      throw new NotFoundException(sysMsg.PARENT_NOT_FOUND);
    }

    // 2. Query students where parent_id = parentId and is_deleted = false
    const students = await this.studentModelAction.list({
      filterRecordOptions: {
        parent: { id: parentId },
        is_deleted: false,
      },
      relations: {
        user: true,
      },
    });

    this.logger.info(sysMsg.PARENT_STUDENTS_FETCHED, {
      parentId,
      studentCount: students.payload.length,
    });

    // 3. Transform to StudentBasicDto
    return students.payload.map((student) => {
      const { user } = student;
      return plainToInstance(
        StudentBasicDto,
        {
          id: student.id,
          registration_number: student.registration_number,
          first_name: user.first_name,
          last_name: user.last_name,
          middle_name: user.middle_name,
          full_name: `${user.first_name}${user.middle_name ? ' ' + user.middle_name : ''} ${user.last_name}`,
          photo_url: student.photo_url,
        },
        { excludeExtraneousValues: true },
      );
    });
  }

  // --- UNLINK STUDENT FROM PARENT (ADMIN VERSION) ---
  async unlinkStudentFromParent(
    parentId: string,
    studentId: string,
  ): Promise<void> {
    // 1. Validate parent exists
    const parent = await this.parentModelAction.get({
      identifierOptions: { id: parentId },
    });

    if (!parent || parent.deleted_at) {
      this.logger.warn(`Parent not found with ID: ${parentId}`);
      throw new NotFoundException(sysMsg.PARENT_NOT_FOUND);
    }

    // 2. Validate student exists
    const student = await this.studentModelAction.get({
      identifierOptions: { id: studentId },
      relations: { parent: true },
    });

    if (!student || student.is_deleted) {
      this.logger.warn(`Student not found with ID: ${studentId}`);
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    // 3. Verify student is linked to this parent
    if (!student.parent || student.parent.id !== parentId) {
      this.logger.warn(
        `Student ${studentId} is not linked to parent ${parentId}`,
      );
      throw new BadRequestException(sysMsg.STUDENT_NOT_LINKED_TO_PARENT);
    }

    // 4. Unlink student (set parent to null)
    await this.studentModelAction.update({
      identifierOptions: { id: studentId },
      updatePayload: {
        parent: null,
      },
      transactionOptions: {
        useTransaction: false,
      },
    });

    this.logger.info(sysMsg.STUDENT_UNLINKED_FROM_PARENT, {
      parentId,
      studentId,
    });
  }
}
