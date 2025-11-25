import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource } from 'typeorm';
import { Logger } from 'winston';

import { EmailTemplateID } from '../../constants/email-constants';
import * as sysMsg from '../../constants/system.messages';
import { EmailService } from '../email/email.service';
import { EmailPayload } from '../email/email.types';

import { CreateContactDto } from './dto/create-contact.dto';
import { Contact, ContactStatus } from './entities/contact.entity';
import { ContactModelAction } from './model-actions/contact-actions';
import { SpamDetectionService } from './spam-detection.service';
@Injectable()
export class ContactService {
  private readonly logger: Logger;

  constructor(
    private readonly contactModelAction: ContactModelAction,
    private readonly dataSource: DataSource,
    @Inject(WINSTON_MODULE_PROVIDER) logger: Logger,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly spamDetectionService: SpamDetectionService,
  ) {
    this.logger = logger.child({ context: ContactService.name });
  }

  async create(createContactDto: CreateContactDto) {
    this.spamDetectionService.validateSubmission(createContactDto);

    return this.dataSource.transaction(async (manager) => {
      // Create contact entry
      const savedContact = await this.contactModelAction.create({
        createPayload: {
          ...createContactDto,
          status: ContactStatus.PENDING,
        },
        transactionOptions: {
          useTransaction: true,
          transaction: manager,
        },
      });

      // Send both emails in parallel with error handling
      const emailResults = await Promise.allSettled([
        this.sendAdminNotification(savedContact),
        this.sendUserConfirmation(createContactDto),
      ]);

      // Log any email failures but don't block the response
      emailResults.forEach((result, index) => {
        const emailType =
          index === 0 ? 'admin notification' : 'user confirmation';
        if (result.status === 'rejected') {
          this.logger.error(`Failed to send ${emailType}`, {
            error: result.reason,
            contact_id: savedContact.id,
          });
        }
      });

      this.logger.info('Contact message received', {
        contact_id: savedContact.id,
        email: createContactDto.email,
        admin_email_sent: emailResults[0].status === 'fulfilled',
        user_email_sent: emailResults[1].status === 'fulfilled',
      });

      return {
        message: sysMsg.CONTACT_MESSAGE_SENT,
        contact_id: savedContact.id,
      };
    });
  }

  private async sendAdminNotification(contact: Contact) {
    const adminEmail = this.configService.get<string>('mail.from.address');
    const emailPayload: EmailPayload = {
      to: [{ email: adminEmail || 'support@openschoolportal.com' }],
      subject: 'New Contact Message Received',
      templateNameID: EmailTemplateID.CONTACT_ADMIN_NOTIFICATION,
      templateData: {
        full_name: contact.full_name,
        email: contact.email,
        school_name: contact.school_name || 'Not provided',
        message: contact.message,
        contact_id: contact.id,
        submitted_at: contact.created_at.toISOString(),
      },
    };

    await this.emailService.sendMail(emailPayload);
    this.logger.info('Admin notification sent', {
      contact_id: contact.id,
    });
  }

  private async sendUserConfirmation(contactDto: CreateContactDto) {
    const emailPayload: EmailPayload = {
      to: [{ email: contactDto.email, name: contactDto.full_name }],
      subject: 'Contact Form Submission Confirmation',
      templateNameID: EmailTemplateID.CONTACT_USER_CONFIRMATION,
      templateData: {
        full_name: contactDto.full_name,
        message: contactDto.message,
      },
    };

    await this.emailService.sendMail(emailPayload);
    this.logger.info('User confirmation sent', {
      email: contactDto.email,
    });
  }
}
