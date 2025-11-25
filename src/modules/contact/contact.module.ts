import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { EmailModule } from '../email/email.module';

import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { Contact } from './entities/contact.entity';
import { ContactModelAction } from './model-actions/contact-actions';
import { SpamDetectionService } from './spam-detection.service';

@Module({
  imports: [TypeOrmModule.forFeature([Contact]), EmailModule],
  controllers: [ContactController],
  providers: [
    ContactService,
    ContactModelAction,
    SpamDetectionService,
    RateLimitGuard,
  ],
  exports: [ContactService, ContactModelAction],
})
export class ContactModule {}
