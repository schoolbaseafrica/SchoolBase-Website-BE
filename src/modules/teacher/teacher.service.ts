import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository, DataSource } from 'typeorm';

import { UserRole } from '../shared/enums';
import { FileService } from '../shared/file/file.service';
import {
  hashPassword,
  generateStrongPassword,
} from '../shared/utils/password.util';
import { User } from '../user/entities/user.entity';

import {
  CreateTeacherDto,
  UpdateTeacherDto,
  GetTeachersQueryDto,
  TeacherResponseDto,
} from './dto';
import { GeneratePasswordResponseDto } from './dto/generate-password-response.dto';
import { Teacher } from './entities/teacher.entity';
import { generateEmploymentId } from './utils/employment-id.util';

@Injectable()
export class TeacherService {
  constructor(
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
    private fileService: FileService,
  ) {}

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
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Check for existing user with email
      const existingUser = await this.userRepository.findOne({
        where: { email: createDto.email },
      });
      if (existingUser) {
        throw new ConflictException(
          `User with email ${createDto.email} already exists.`,
        );
      }

      // 2. Generate Employment ID
      const employmentId =
        createDto.employment_id ||
        (await generateEmploymentId(this.teacherRepository));
      const existingTeacher = await this.teacherRepository.findOne({
        where: { employmentId },
      });
      if (existingTeacher) {
        throw new ConflictException(
          `Employment ID ${employmentId} already exists.`,
        );
      }

      // 3. Prepare User data
      const rawPassword = createDto.password || generateStrongPassword(12);
      const hashedPassword = await hashPassword(rawPassword);

      const newUser = this.userRepository.create({
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
      });

      const savedUser = await queryRunner.manager.save(User, newUser);

      // 4. Validate Photo URL if provided
      let photoUrl: string | undefined = undefined;
      if (createDto.photo_url) {
        photoUrl = this.fileService.validatePhotoUrl(createDto.photo_url);
      }

      // 5. Prepare Teacher data
      const newTeacher = this.teacherRepository.create({
        userId: savedUser.id,
        employmentId: employmentId,
        title: createDto.title,
        photoUrl: photoUrl,
        isActive: createDto.is_active ?? true,
      });

      const savedTeacher = await queryRunner.manager.save(Teacher, newTeacher);

      await queryRunner.commitTransaction();

      // 6. Return response (Transform User/Teacher entities into DTO)
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
        is_active: savedTeacher.isActive,
        employment_id: savedTeacher.employmentId,
        photo_url: savedTeacher.photoUrl,
        created_at: savedTeacher.createdAt,
        updated_at: savedTeacher.updatedAt,
      };

      return plainToInstance(TeacherResponseDto, response, {
        excludeExtraneousValues: true,
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (err instanceof ConflictException) throw err;
      throw new InternalServerErrorException(
        `Teacher creation failed: ${err.message}`,
      );
    } finally {
      await queryRunner.release();
    }
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
        is_active: t.isActive,
        employment_id: t.employmentId,
        photo_url: t.photoUrl,
        created_at: t.createdAt,
        updated_at: t.updatedAt,
      })),
      { excludeExtraneousValues: true },
    );

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
  async findOne(id: number): Promise<TeacherResponseDto> {
    const teacher = await this.teacherRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!teacher) {
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
      is_active: teacher.isActive,
      employment_id: teacher.employmentId,
      photo_url: teacher.photoUrl,
      created_at: teacher.createdAt,
      updated_at: teacher.updatedAt,
    };

    return plainToInstance(TeacherResponseDto, response, {
      excludeExtraneousValues: true,
    });
  }

  // --- UPDATE ---
  async update(
    id: number,
    updateDto: UpdateTeacherDto,
  ): Promise<TeacherResponseDto> {
    const teacher = await this.teacherRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }

    // IMMUTABILITY CHECK: Employment ID cannot be updated
    if (
      updateDto.employment_id &&
      updateDto.employment_id !== teacher.employmentId
    ) {
      throw new ConflictException(
        'Employment ID cannot be updated after creation.',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Update User Data (Common fields)
      if (updateDto.first_name !== undefined)
        teacher.user.first_name = updateDto.first_name;
      if (updateDto.last_name !== undefined)
        teacher.user.last_name = updateDto.last_name;
      if (updateDto.middle_name !== undefined)
        teacher.user.middle_name = updateDto.middle_name;
      if (updateDto.phone !== undefined) teacher.user.phone = updateDto.phone;
      if (updateDto.gender !== undefined)
        teacher.user.gender = updateDto.gender;
      if (updateDto.date_of_birth !== undefined)
        teacher.user.dob = new Date(updateDto.date_of_birth);
      if (updateDto.home_address !== undefined)
        teacher.user.homeAddress = updateDto.home_address;
      if (updateDto.is_active !== undefined)
        teacher.user.is_active = updateDto.is_active;

      const updatedUser = await queryRunner.manager.save(User, teacher.user);

      // 2. Update Teacher Data (Teacher-specific fields)
      if (updateDto.title !== undefined) teacher.title = updateDto.title;
      if (updateDto.is_active !== undefined)
        teacher.isActive = updateDto.is_active;

      // 3. Handle Photo URL Update
      if (updateDto.photo_url !== undefined) {
        // Validate the new photo URL
        teacher.photoUrl = updateDto.photo_url
          ? this.fileService.validatePhotoUrl(updateDto.photo_url)
          : null;
      }

      const updatedTeacher = await queryRunner.manager.save(Teacher, teacher);

      await queryRunner.commitTransaction();

      // 4. Return response
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
        is_active: updatedTeacher.isActive,
        employment_id: updatedTeacher.employmentId,
        photo_url: updatedTeacher.photoUrl,
        created_at: updatedTeacher.createdAt,
        updated_at: updatedTeacher.updatedAt,
      };

      return plainToInstance(TeacherResponseDto, response, {
        excludeExtraneousValues: true,
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        `Teacher update failed: ${err.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  // --- DELETE (Soft Delete / Deactivate) ---
  async remove(id: number): Promise<void> {
    const teacher = await this.teacherRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${id} not found`);
    }

    // Set isActive to false (Deactivate)
    teacher.isActive = false;
    await this.teacherRepository.save(teacher);

    // Also deactivate the associated user account
    teacher.user.is_active = false;
    await this.userRepository.save(teacher.user);
  }
}
