import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../constants/system.messages';
import { UserRole } from '../shared/enums';
import { FileService } from '../shared/file/file.service';
import {
  generateStrongPassword,
  hashPassword,
} from '../shared/utils/password.util';
import { UserModelAction } from '../user/model-actions/user-actions';

import { CreateParentDto, ParentResponseDto } from './dto';
import { ParentModelAction } from './model-actions/parent-actions';

@Injectable()
export class ParentService {
  private readonly logger: Logger;
  constructor(
    private readonly parentModelAction: ParentModelAction,
    private readonly userModelAction: UserModelAction,
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
          middle_name: createDto.middle_name,
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
}
