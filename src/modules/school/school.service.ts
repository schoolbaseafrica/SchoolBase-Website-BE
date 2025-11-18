import { Injectable } from '@nestjs/common';

@Injectable()
export class SchoolService {
  findAll() {
    return `This action returns all school`;
  }

  findOne(id: number) {
    return `This action returns a #${id} school`;
  }

  remove(id: number) {
    return `This action removes a #${id} school`;
  }
}
