import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard';

import { ContactService } from './contact.service';
import { ApiContactTags, ApiCreateContact } from './docs/contact.swagger';
import { CreateContactDto } from './dto/create-contact.dto';

@Controller('contact')
@ApiContactTags()
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @UseGuards(RateLimitGuard)
  @RateLimit({ maxRequests: 3, windowMs: 15 * 60 * 1000 }) // 3 requests per 15 minutes
  @ApiCreateContact()
  create(@Body() createContactDto: CreateContactDto) {
    return this.contactService.create(createContactDto);
  }
}
