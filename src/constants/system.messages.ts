

//system messages object
// This object contains constant strings used throughout the system for various messages.
//example: SYS_MSG.ACCOUNT_CREATED will return "ACCOUNT_CREATED"
//example usage in your controller or service:
// import { SYS_MSG } from 'src/constants/system.messages';
// message:SYS_MSG. account_created; when a new account is created successfully.

export const SYS_MSG = {
  // Authentication
  login_success: "LOGIN_SUCCESS",
  login_failed: "LOGIN_FAILED",
  invalid_credentials: "INVALID_CREDENTIALS",
  token_expired: "TOKEN_EXPIRED",
  token_invalid: "TOKEN_INVALID",

  // User / Account
  account_created: "ACCOUNT_CREATED",
  account_not_found: "ACCOUNT_NOT_FOUND",
  account_already_exists: "ACCOUNT_ALREADY_EXISTS",
  user_not_found: "USER_NOT_FOUND",

  // Authorization
  unauthorized: "UNAUTHORIZED",
  forbidden: "FORBIDDEN",
  not_allowed: "NOT_ALLOWED",
  permission_denied: "PERMISSION_DENIED",

  // Validation
  validation_error: "VALIDATION_ERROR",
  invalid_payload: "INVALID_PAYLOAD",
  invalid_parameter: "INVALID_PARAMETER",
  missing_fields: "MISSING_FIELDS",

  // Resource / CRUD
  resource_created: "RESOURCE_CREATED",
  resource_updated: "RESOURCE_UPDATED",
  resource_deleted: "RESOURCE_DELETED",
  resource_not_found: "RESOURCE_NOT_FOUND",
  resource_already_exists: "RESOURCE_ALREADY_EXISTS",

  // Internal errors
  server_error: "SERVER_ERROR",
  internal_server_error: "INTERNAL_SERVER_ERROR",
  database_error: "DATABASE_ERROR",
  service_unavailable: "SERVICE_UNAVAILABLE",
  operation_failed: "OPERATION_FAILED",
  timeout_error: "TIMEOUT_ERROR",

  // Network / System
  network_error: "NETWORK_ERROR",
  request_failed: "REQUEST_FAILED",
  retry_later: "RETRY_LATER",

  // Rate limits
  too_many_requests: "TOO_MANY_REQUESTS",
  rate_limit_exceeded: "RATE_LIMIT_EXCEEDED",
} as const;

