import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmailModule } from '../email/email.module';

import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { Contact } from './entities/contact.entity';
import { ContactModelAction } from './model-actions/contact-actions';

@Module({
  imports: [TypeOrmModule.forFeature([Contact]), EmailModule],
  controllers: [ContactController],
  providers: [ContactService, ContactModelAction],
  exports: [ContactService, ContactModelAction],
})
export class ContactModule {}
