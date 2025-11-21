//system messages object
// This object contains constant strings used throughout the system for various messages.
//example: SYS_MSG.ACCOUNT_CREATED will return "ACCOUNT_CREATED"
//example usage in your controller or service:
// import { LOGIN_SUCCESS } from 'src/constants/system.messages';
// message:LOGIN_SUCCESS;

//NOTE: you can modify the messages as per your requirements.You can also add new messages as needed.

//⚠️ WARNING: Do not change the variable names as they are used throughout the system. check before modifying or adding new messages.

// Authentication
export const LOGIN_SUCCESS = 'login success';
export const LOGIN_FAILED = 'login failed';
export const INVALID_CREDENTIALS = 'invalid credentials';
export const TOKEN_EXPIRED = 'token expired';
export const TOKEN_INVALID = 'token invalid';
export const TOKEN_REFRESH_SUCCESS = 'Tokens refresh successful';
export const LOGOUT_SUCCESS = 'logout success';

export const ACTIVATE_ACCOUNT = 'Activate a user account';
export const USER_IS_ACTIVATED = 'user already activated';
export const USER_ACTIVATED = 'user activated';
export const USER_INACTIVE = 'user account inactive';
export const USER_ACTIVE = 'user account active';
export const PROFILE_RETRIEVED = 'user profile retrieved successfully';

// User / Account
export const ACCOUNT_CREATED = 'account created';
export const ACCOUNT_NOT_FOUND = 'account not found';
export const ACCOUNT_ALREADY_EXISTS = 'account already exists';
export const USER_NOT_FOUND = 'user not found';
export const ACCOUNT_DELETED = 'account deleted';

// Email Verification
export const EMAIL_VERIFICATION_SENT = 'email verification sent';
export const EMAIL_ALREADY_VERIFIED = 'email already verified';
export const EMAIL_NOT_VERIFIED = 'email not verified';
export const EMAIL_VERIFICATION_FAILED = 'email verification failed';
export const EMAIL_VERIFICATION_EXPIRED = 'email verification expired';
export const EMAIL_VERIFICATION_SUCCESS = 'email verification success';
export const INVALID_VERIFICATION_TOKEN = 'invalid verification token';

// Password Reset
export const PASSWORD_RESET_SENT = 'password reset email sent';
export const PASSWORD_RESET_SUCCESS = 'password reset success';
export const PASSWORD_RESET_FAILED = 'password reset failed';
export const PASSWORD_RESET_TOKEN_INVALID = 'password reset token invalid';
export const PASSWORD_RESET_TOKEN_EXPIRED = 'password reset token expired';
export const PASSWORD_SAME_AS_OLD =
  'new password cannot be same as old password';

// Multi-Factor Authentication (MFA)
export const MFA_REQUIRED = 'mfa required';
export const MFA_CODE_SENT = 'mfa code sent';
export const MFA_CODE_INVALID = 'mfa code invalid';
export const MFA_CODE_EXPIRED = 'mfa code expired';
export const MFA_SETUP_SUCCESS = 'mfa setup success';
export const MFA_SETUP_FAILED = 'mfa setup failed';

// Authorization
export const UNAUTHORIZED = 'unauthorized';
export const FORBIDDEN = 'forbidden';
export const NOT_ALLOWED = 'not allowed';
export const PERMISSION_DENIED = 'permission denied';
export const AUTHORIZATION_HEADER_MISSING = 'authorization header missing';

// Validation
export const VALIDATION_ERROR = 'validation error';
export const INVALID_PAYLOAD = 'invalid payload';
export const INVALID_PARAMETER = 'invalid parameter';
export const MISSING_FIELDS = 'missing fields';

// Resource / CRUD
export const RESOURCE_CREATED = 'resource created';
export const RESOURCE_UPDATED = 'resource updated';
export const RESOURCE_DELETED = 'resource deleted';
export const RESOURCE_NOT_FOUND = 'resource not found';
export const RESOURCE_ALREADY_EXISTS = 'resource already exists';

// General messages
export const OPERATION_SUCCESSFUL = 'Operation completed successfully';
export const NOT_FOUND = 'Resource not found';
export const BAD_REQUEST = 'Bad request';

// Internal errors
export const SERVER_ERROR = 'server error';
export const INTERNAL_SERVER_ERROR = 'internal server error';
export const DATABASE_ERROR = 'database error';
export const SERVICE_UNAVAILABLE = 'service unavailable';
export const OPERATION_FAILED = 'operation failed';
export const TIMEOUT_ERROR = 'timeout error';

// Network / System
export const NETWORK_ERROR = 'network error';
export const REQUEST_FAILED = 'request failed';
export const RETRY_LATER = 'retry later';

// Waitlist messages
export const WAITLIST_ADDED_SUCCESSFULLY = 'Successfully added to waitlist';
export const WAITLIST_RETRIEVED_SUCCESSFULLY =
  'Waitlist entries retrieved successfully';
export const EMAIL_ALREADY_EXISTS = 'Email already exists in waitlist';
export const WAITLIST_REMOVED_SUCCESSFULLY =
  'Entry removed from waitlist successfully';

// Rate limits
export const TOO_MANY_REQUESTS = 'too many requests';
export const RATE_LIMIT_EXCEEDED = 'rate limit exceeded';

// File Upload / Media
export const FILE_TOO_LARGE = 'file too large';
export const UNSUPPORTED_FILE_TYPE = 'unsupported file type';
export const FILE_UPLOAD_FAILED = 'file upload failed';

// Payment / Billing
export const PAYMENT_SUCCESS = 'payment success';
export const PAYMENT_FAILED = 'payment failed';
export const PAYMENT_DECLINED = 'payment declined';
export const INSUFFICIENT_FUNDS = 'insufficient funds';
export const SUBSCRIPTION_EXPIRED = 'subscription expired';
export const SUBSCRIPTION_ACTIVE = 'subscription active';

// Notifications
export const NOTIFICATION_SENT = 'notification sent';
export const NOTIFICATION_FAILED = 'notification failed';

// Invites
export const INVITE_SENT = 'INVITE_SENT';
export const PENDING_INVITES_FETCHED = 'Pending invites retrieved successfully';
export const NO_PENDING_INVITES = 'No pending invites found';
export const INVITE_ALREADY_SENT = 'INVITE_ALREADY_SENT';

//Academic Session
export const ACADEMIC_SESSION =
  'Retrieves the currently active academic session';
export const ACADEMIC_SESSION_CREATED =
  'Academic session created successfully.';
export const DUPLICATE_SESSION_NAME =
  'An academic session with this name already exists.';
export const INVALID_DATE_RANGE = 'End date must be after start date.';
export const START_DATE_IN_PAST = 'Start date cannot be in the past.';
export const END_DATE_IN_PAST = 'End date cannot be in the past.';
export const ACTIVE_ACADEMIC_SESSION_SUCCESS =
  'Academic session retrieved successfully.';
export const MULTIPLE_ACTIVE_ACADEMIC_SESSION =
  'Multiple academic session records detected.';
export const ACADEMIC_SESSION_LIST_SUCCESS =
  'Academic session list retrieved successfully.';

// Session management messages
export const SESSION_REVOKED = 'session revoked successfully';
export const SESSIONS_REVOKED = 'all user sessions revoked successfully';
export const SESSION_NOT_FOUND = 'session not found';
export const CANNOT_REVOKE_OTHER_SESSIONS = 'cannot revoke other user sessions';
