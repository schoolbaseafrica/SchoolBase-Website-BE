import { Body, Controller, Post } from '@nestjs/common';

import { ContactService } from './contact.service';
import { ApiContactTags, ApiCreateContact } from './docs/contact.swagger';
import { CreateContactDto } from './dto/create-contact.dto';
@Controller('contact')
@ApiContactTags()
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @ApiCreateContact()
  create(@Body() createContactDto: CreateContactDto) {
    return this.contactService.create(createContactDto);
  }
}
