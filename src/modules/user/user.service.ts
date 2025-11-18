import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

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

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
