import * as fs from 'fs/promises';
import * as path from 'path';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as nunjucks from 'nunjucks';

import { EmailPayload } from './email.types';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    // Initialize the transporter
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('mail.host'),
      port: this.configService.get<number>('mail.port'),
      secure: this.configService.get<number>('mail.port') === 465,

      auth: {
        user: this.configService.get<string>('mail.username'),
        pass: this.configService.get<string>('mail.password'),
      },
      pool: true,
      maxConnections: 5,
    });
  }

  /**
   * Compiles an email template using Nunjucks.
   * @param templateName The filename of the template (e.g., "welcome.njk")
   * @param context The data to inject
   * @returns The compiled HTML string
   */
  private async compileTemplate(
    templateName: string,
    context: Record<string, unknown>,
  ): Promise<string> {
    const templatePath = path.join(
      process.cwd(),
      'dist',
      'templates',
      templateName,
    );

    try {
      const template = await fs.readFile(templatePath, 'utf-8');

      const fullContext = {
        ...context,
        copyRightYear: new Date().getFullYear(),
      };

      return nunjucks.renderString(template, fullContext);
    } catch (error) {
      this.logger.error(
        `Error reading or compiling template at: ${templatePath}`,
        error,
      );
      throw new Error('Could not load or compile email template.');
    }
  }

  /**
   * Sends an email using the provided payload.
   * This is the main public method for this service.
   * @param payload The EmailPayload object
   */
  async sendMail(payload: EmailPayload): Promise<void> {
    const { from, to, subject, templateNameID, templateData, text } = payload;

    const html = await this.compileTemplate(templateNameID, templateData);

    const fromAddress =
      from?.email ?? this.configService.get<string>('mail.from.address');
    const fromName =
      from?.name ??
      this.configService.get<string>('mail.from.name') ??
      'Open School Portal';

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${fromName}" <${fromAddress}>`,
      to: to
        .map((t) => (t.name ? `"${t.name}" <${t.email}>` : t.email))
        .join(', '),
      subject: subject,
      html: html,
      text: text, // Optional plain-text version
    };

    // Send the email
    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Email sent successfully to ${mailOptions.to}: ${info.messageId}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send email to ${mailOptions.to}`, error);
      throw error;
    }
  }
}
