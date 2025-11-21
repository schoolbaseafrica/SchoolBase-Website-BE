import { Injectable } from '@nestjs/common';

import { CreateTermDto } from './dto/create-term.dto';
import { UpdateTermDto } from './dto/update-term.dto';

@Injectable()
export class TermService {
  create(createTermDto: CreateTermDto) {
    return createTermDto;
  }

  findAll() {
    return `This action returns all term`;
  }

  findOne(id: number) {
    return `This action returns a #${id} term`;
  }

  update(id: number, updateTermDto: UpdateTermDto) {
    return `#${id}: ${updateTermDto}`;
  }

  remove(id: number) {
    return `This action removes a #${id} term`;
  }
}
