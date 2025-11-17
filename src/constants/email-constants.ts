/**
 * Defines the filenames for email templates.
 * This ensures we use constants instead of magic strings.
 */
export const EmailTemplateID = {
  WaitlistWelcome: 'waitlist-welcome.njk',
} as const;

export type EmailTemplateID =
  (typeof EmailTemplateID)[keyof typeof EmailTemplateID];
