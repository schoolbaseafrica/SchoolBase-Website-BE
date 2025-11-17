import { Injectable } from '@nestjs/common';

@Injectable()
export class WaitlistService {
  findAll() {
    return `This action returns all waitlist`;
  }

  findOne(id: number) {
    return `This action returns a #${id} waitlist`;
  }

  remove(id: number) {
    return `This action removes a #${id} waitlist`;
  }
}
