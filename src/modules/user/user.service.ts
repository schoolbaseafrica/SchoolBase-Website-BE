import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  // private readonly logger: Logger;
  constructor() {
    // @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    // this.logger = logger.child({
    //   context: UserService.name,
    // });
  }
  create() {
    // this.logger.info('Logging action');
    return 'This action adds a new user';
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
