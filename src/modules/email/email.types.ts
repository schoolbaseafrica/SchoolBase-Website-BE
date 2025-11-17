import { EmailTemplateID } from '../../constants/email-constants';

/**
 * The standard payload for sending an email via the EmailService.
 * This is used by other services (e.g., WaitlistService) to build a request.
 */
export type EmailPayload = {
  from?: { email: string; name?: string };
  to: { email: string; name?: string }[];
  subject: string;
  templateNameID: EmailTemplateID;
  context: Record<string, unknown>;
  text?: string;
};
