import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    // Initialize the transporter
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: this.configService.get<number>('MAIL_PORT') === 465, 
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  /**
   * Reads an email template and compiles it with Handlebars
   */
  private async getEmailHtml(
    templateName: string,
    data: Record<string, any>,
  ): Promise<string> {
    const templatePath = path.join(
      process.cwd(),
      'dist', 
      'modules',
      'email',
      'templates',
      `${templateName}.html`,
    );

    try {
      const templateSource = await fs.readFile(templatePath, 'utf-8');
      const template = handlebars.compile(templateSource);
      return template(data);
    } catch (error) {
      this.logger.error(`Error reading email template at path: ${templatePath}`, error);
      throw new Error('Could not load email template');
    }
  }

  /**
   * Sends the waitlist welcome email
   * @param user - User object with email, firstName, etc.
   */
  async sendWaitlistWelcomeEmail(user: {
    email: string;
    firstName: string;
  }) {
    const { email, firstName } = user;
    const html = await this.getEmailHtml('waitlist-welcome', { firstName });

    const mailOptions = {
      from: `"Open School Portal" <${this.configService.get<string>('MAIL_FROM_ADDRESS')}>`,
      to: email,
      subject: "You're on the waitlist! | Open School Portal",
      html: html,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Waitlist email sent to ${email}: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send waitlist email to ${email}`, error);
    }
  }
}