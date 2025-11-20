import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ApiSuccessResponseDto } from '../../common/dto/response.dto';
import { UserNotFoundException } from '../../common/exceptions/domain.exceptions';
import * as sysMsg from '../../constants/system.messages';

import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { UserModelAction } from './model-actions/user-actions';

@Injectable()
export class UserService {
  // private readonly logger: Logger;

  constructor(
    private readonly userModelAction: UserModelAction,
    private readonly dataSource: DataSource,
  ) {
    // @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    // this.logger = logger.child({
    //   context: UserService.name,
    // });
  }

  async create(createPayload: CreateUserDto): Promise<User> {
    return this.dataSource.transaction(async (manager) => {
      const newUser = await this.userModelAction.create({
        createPayload: {
          ...createPayload,
          is_active: true,
        },
        transactionOptions: { useTransaction: true, transaction: manager },
      });
      return newUser;
    });
  }

  async updateUser(
    payload: Parameters<typeof this.userModelAction.update>[0]['updatePayload'],
    identifierOptions: Parameters<
      typeof this.userModelAction.update
    >[0]['identifierOptions'],
    options?: Parameters<
      typeof this.userModelAction.update
    >[0]['transactionOptions'],
  ) {
    return this.userModelAction.update({
      updatePayload: payload,
      identifierOptions,
      transactionOptions: options,
    });
  }

  async findByResetToken(resetToken: string) {
    return this.userModelAction.get({
      identifierOptions: { reset_token: resetToken },
    });
  }

  async findByEmail(email: string) {
    return this.userModelAction.get({
      identifierOptions: { email },
    });
  }

  async findOne(id: string) {
    return this.userModelAction.get({
      identifierOptions: { id },
    });
  }

  findAll() {
    return `This action returns all user`;
  }

  update(id: number) {
    return `This action updates a #${id} user`;
  }

  async remove(id: string) {
    const user = await this.userModelAction.get({
      identifierOptions: { id },
    });
    if (!user || user.deleted_at) {
      throw new UserNotFoundException(id);
    }
    await this.userModelAction.update({
      identifierOptions: { id },
      updatePayload: { deleted_at: new Date() },
      transactionOptions: { useTransaction: false },
    });
    return new ApiSuccessResponseDto(sysMsg.ACCOUNT_DELETED);
  }
}
