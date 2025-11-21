import {
  Injectable,
  ConflictException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource, Repository } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../constants/system.messages';
import { UserRole } from '../shared/enums';
import { FileService } from '../shared/file/file.service';
import {
  hashPassword,
  generateStrongPassword,
} from '../shared/utils/password.util';
import { User } from '../user/entities/user.entity';
import { UserModelAction } from '../user/model-actions/user-actions';

import {
  CreateTeacherDto,
  UpdateTeacherDto,
  GetTeachersQueryDto,
  TeacherResponseDto,
} from './dto';
import { GeneratePasswordResponseDto } from './dto/generate-password-response.dto';
import { Teacher } from './entities/teacher.entity';
import { TeacherModelAction } from './model-actions/teacher-actions';
import { generateEmploymentId } from './utils/employment-id.util';

@Injectable()
export class TeacherService {
  private readonly logger: Logger;
  constructor(
    private readonly teacherModelAction: TeacherModelAction,
    private readonly userModelAction: UserModelAction,
    private readonly dataSource: DataSource,
    private readonly fileService: FileService,
    // Keep repository for complex queries and employment ID generation
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @Inject(WINSTON_MODULE_PROVIDER) baseLogger: Logger,
  ) {
    this.logger = baseLogger.child({ context: TeacherService.name });
  }

  // --- PASSWORD GENERATION ---
  generatePassword(): GeneratePasswordResponseDto {
    const password = generateStrongPassword(12);

    // Determine password strength (simple check)
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const strengthCount = [hasUpper, hasLower, hasNumber].filter(
      Boolean,
    ).length;

    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    if (strengthCount === 3 && password.length >= 12) {
      strength = 'strong';
    } else if (strengthCount >= 2) {
      strength = 'medium';
    }

    return { password, strength };
  }

  // --- CREATE ---
  async create(createDto: CreateTeacherDto): Promise<TeacherResponseDto> {
    // 1. Check for existing user with email
    const existingUser = await this.userModelAction.get({
      identifierOptions: { email: createDto.email },
    });
    if (existingUser) {
      this.logger.warn(
        `Attempt to create teacher with existing email: ${createDto.email}`,
      );
      throw new ConflictException(
        `User with email ${createDto.email} already exists.`,
      );
    }

    // 2. Generate Employment ID
    const employment_id =
      createDto.employment_id ||
      (await generateEmploymentId(this.teacherRepository));
    const existingTeacher = await this.teacherModelAction.get({
      identifierOptions: { employment_id },
    });
    if (existingTeacher) {
      this.logger.warn(
        `Attempt to create teacher with existing employment ID: ${employment_id}`,
      );
      throw new ConflictException(
        `Employment ID ${employment_id} already exists.`,
      );
    }

    // 3. Prepare User data
    const rawPassword = createDto.password || generateStrongPassword(12);
    const hashedPassword = await hashPassword(rawPassword);

    // 4. Validate Photo URL if provided
    let photo_url: string | undefined = undefined;
    if (createDto.photo_url) {
      photo_url = this.fileService.validatePhotoUrl(createDto.photo_url);
    }

    return this.dataSource.transaction(async (manager) => {
      // 5. Create User using model action within transaction
      const savedUser = await this.userModelAction.create({
        createPayload: {
          first_name: createDto.first_name,
          last_name: createDto.last_name,
          middle_name: createDto.middle_name,
          email: createDto.email,
          phone: createDto.phone,
          gender: createDto.gender,
          dob: new Date(createDto.date_of_birth),
          homeAddress: createDto.home_address,
          password: hashedPassword,
          role: [UserRole.TEACHER],
          is_active: createDto.is_active ?? true,
        },
        transactionOptions: {
          useTransaction: true,
          transaction: manager,
        },
      });

      // 6. Create Teacher using model action within transaction
      const savedTeacher = await this.teacherModelAction.create({
        createPayload: {
          user_id: savedUser.id,
          employment_id: employment_id,
          title: createDto.title,
          photo_url: photo_url,
          is_active: createDto.is_active ?? true,
        },
        transactionOptions: {
          useTransaction: true,
          transaction: manager,
        },
      });

      // 7. Return response (Transform User/Teacher entities into DTO)
      const response = {
        ...savedTeacher,
        first_name: savedUser.first_name,
        last_name: savedUser.last_name,
        middle_name: savedUser.middle_name,
        email: savedUser.email,
        phone: savedUser.phone,
        gender: savedUser.gender,
        date_of_birth: savedUser.dob,
        home_address: savedUser.homeAddress,
        is_active: savedTeacher.is_active,
        employment_id: savedTeacher.employment_id,
        photo_url: savedTeacher.photo_url,
        created_at: savedTeacher.createdAt,
        updated_at: savedTeacher.updatedAt,
      };

      this.logger.info(sysMsg.RESOURCE_CREATED, {
        teacherId: savedTeacher.id,
        employmentId: savedTeacher.employment_id,
        email: savedUser.email,
      });

      return plainToInstance(TeacherResponseDto, response, {
        excludeExtraneousValues: true,
      });
    });
  }

  // --- READ (LIST) ---
  async findAll(query: GetTeachersQueryDto) {
    const { page, limit, search, is_active, sort_by, order } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.teacherRepository.createQueryBuilder('teacher');

    // Join with User entity to search on user fields
    queryBuilder.leftJoinAndSelect('teacher.user', 'user');

    // Active/Inactive Filter
    if (is_active !== undefined) {
      queryBuilder.andWhere('teacher.is_active = :isActive', {
        isActive: is_active,
      });
    }

    // Search Logic (Case-insensitive across multiple fields)
    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`;
      queryBuilder.andWhere(
        '(LOWER(user.first_name) LIKE :searchTerm OR LOWER(user.last_name) LIKE :searchTerm OR LOWER(user.email) LIKE :searchTerm OR LOWER(teacher.employment_id) LIKE :searchTerm)',
        { searchTerm },
      );
    }

    // Sorting - must be done before getCount() to avoid metadata issues
    let orderByField = 'teacher.created_at';
    if (sort_by === 'employment_id') orderByField = 'teacher.employment_id';
    if (sort_by === 'name') {
      // For name sorting, use the joined user entity
      queryBuilder.addOrderBy(
        'user.last_name',
        order.toUpperCase() as 'ASC' | 'DESC',
      );
    } else {
      queryBuilder.orderBy(orderByField, order.toUpperCase() as 'ASC' | 'DESC');
    }

    // Total count for pagination metadata (after ordering is set)
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    const teachers = await queryBuilder.getMany();

    // Transform to DTO
    const data = plainToInstance(
      TeacherResponseDto,
      teachers.map((t) => ({
        ...t,
        first_name: t.user.first_name,
        last_name: t.user.last_name,
        middle_name: t.user.middle_name,
        email: t.user.email,
        phone: t.user.phone,
        gender: t.user.gender,
        date_of_birth: t.user.dob,
        home_address: t.user.homeAddress,
        is_active: t.is_active,
        employment_id: t.employment_id,
        photo_url: t.photo_url,
        created_at: t.createdAt,
        updated_at: t.updatedAt,
      })),
      { excludeExtraneousValues: true },
    );

    this.logger.info('Teachers list retrieved', {
      total,
      page,
      limit,
      search: search || null,
      isActive: is_active,
    });

    // Return Paginated Response Structure
    return {
      data,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  // --- READ (ONE) ---
  async findOne(id: string): Promise<TeacherResponseDto> {
    const teacher = await this.teacherModelAction.get({
      identifierOptions: { id },
      relations: { user: true },
    });

    if (!teacher) {
      this.logger.warn(sysMsg.RESOURCE_NOT_FOUND, { teacherId: id });
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }

    const response = {
      ...teacher,
      first_name: teacher.user.first_name,
      last_name: teacher.user.last_name,
      middle_name: teacher.user.middle_name,
      email: teacher.user.email,
      phone: teacher.user.phone,
      gender: teacher.user.gender,
      date_of_birth: teacher.user.dob,
      home_address: teacher.user.homeAddress,
      is_active: teacher.is_active,
      employment_id: teacher.employment_id,
      photo_url: teacher.photo_url,
      created_at: teacher.createdAt,
      updated_at: teacher.updatedAt,
    };

    return plainToInstance(TeacherResponseDto, response, {
      excludeExtraneousValues: true,
    });
  }

  // --- UPDATE ---
  async update(
    id: string,
    updateDto: UpdateTeacherDto,
  ): Promise<TeacherResponseDto> {
    const teacher = await this.teacherModelAction.get({
      identifierOptions: { id },
      relations: { user: true },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }

    // IMMUTABILITY CHECK: Employment ID cannot be updated
    if (
      updateDto.employment_id &&
      updateDto.employment_id !== teacher.employment_id
    ) {
      this.logger.warn('Attempt to update employment ID', {
        teacherId: id,
        currentEmploymentId: teacher.employment_id,
        attemptedEmploymentId: updateDto.employment_id,
      });
      throw new ConflictException(
        'Employment ID cannot be updated after creation.',
      );
    }

    // Prepare update payloads
    const userUpdatePayload: Partial<User> = {};
    if (updateDto.first_name !== undefined)
      userUpdatePayload.first_name = updateDto.first_name;
    if (updateDto.last_name !== undefined)
      userUpdatePayload.last_name = updateDto.last_name;
    if (updateDto.middle_name !== undefined)
      userUpdatePayload.middle_name = updateDto.middle_name;
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

    const teacherUpdatePayload: Partial<Teacher> = {};
    if (updateDto.title !== undefined)
      teacherUpdatePayload.title = updateDto.title;
    if (updateDto.is_active !== undefined)
      teacherUpdatePayload.is_active = updateDto.is_active;

    // Handle Photo URL Update
    if (updateDto.photo_url !== undefined) {
      teacherUpdatePayload.photo_url = updateDto.photo_url
        ? this.fileService.validatePhotoUrl(updateDto.photo_url)
        : null;
    }

    return this.dataSource.transaction(async (manager) => {
      // Update User Data using model action within transaction
      const updatedUser = await this.userModelAction.update({
        identifierOptions: { id: teacher.user_id },
        updatePayload: userUpdatePayload,
        transactionOptions: {
          useTransaction: true,
          transaction: manager,
        },
      });

      // Update Teacher Data using model action within transaction
      const updatedTeacher = await this.teacherModelAction.update({
        identifierOptions: { id },
        updatePayload: teacherUpdatePayload,
        transactionOptions: {
          useTransaction: true,
          transaction: manager,
        },
      });

      // Return response
      const response = {
        ...updatedTeacher,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        middle_name: updatedUser.middle_name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        gender: updatedUser.gender,
        date_of_birth: updatedUser.dob,
        home_address: updatedUser.homeAddress,
        is_active: updatedTeacher.is_active,
        employment_id: updatedTeacher.employment_id,
        photo_url: updatedTeacher.photo_url,
        created_at: updatedTeacher.createdAt,
        updated_at: updatedTeacher.updatedAt,
      };

      this.logger.info(sysMsg.RESOURCE_UPDATED, {
        teacherId: id,
        employmentId: updatedTeacher.employment_id,
      });

      return plainToInstance(TeacherResponseDto, response, {
        excludeExtraneousValues: true,
      });
    });
  }

  // --- DELETE (Soft Delete / Deactivate) ---
  async remove(id: string): Promise<void> {
    const teacher = await this.teacherModelAction.get({
      identifierOptions: { id },
      relations: { user: true },
    });

    if (!teacher) {
      this.logger.warn(sysMsg.RESOURCE_NOT_FOUND, { teacherId: id });
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }

    return this.dataSource.transaction(async (manager) => {
      // Set is_active to false (Deactivate) within transaction
      await this.teacherModelAction.update({
        identifierOptions: { id },
        updatePayload: { is_active: false },
        transactionOptions: {
          useTransaction: true,
          transaction: manager,
        },
      });

      // Also deactivate the associated user account within transaction
      await this.userModelAction.update({
        identifierOptions: { id: teacher.user_id },
        updatePayload: { is_active: false },
        transactionOptions: {
          useTransaction: true,
          transaction: manager,
        },
      });

      this.logger.info(sysMsg.RESOURCE_DELETED, {
        teacherId: id,
        employmentId: teacher.employment_id,
        userId: teacher.user_id,
      });
    });
  }
}
