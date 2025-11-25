import { AbstractModelAction } from '@hng-sdk/orm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Contact } from '../entities/contact.entity';

@Injectable()
export class ContactModelAction extends AbstractModelAction<Contact> {
  constructor(
    @InjectRepository(Contact)
    contactRepository: Repository<Contact>,
  ) {
    super(contactRepository, Contact);
  }
}
