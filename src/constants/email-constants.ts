/**
 * Defines the filenames for email templates.
 * This ensures we use constants instead of magic strings.
 */
export enum EmailTemplateID {
  WAITLIST_WELCOME = 'waitlist-welcome.njk',
  FORGOT_PASSWORD = 'forgot-password.njk',
  CONTACT_ADMIN_NOTIFICATION = 'contact-admin-notification.njk',
  CONTACT_USER_CONFIRMATION = 'contact-user-confirmation.njk',
  INVITE = 'invite.njk',
}
