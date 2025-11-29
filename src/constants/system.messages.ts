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
export const PASSWORD_RESET_TOKEN_SENT = 'password reset token has been sent';
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
export const FILE_UPLOAD_SUCCESS = 'file uploaded successfully';
export const FILE_REQUIRED = 'file is required';
export const IMAGE_UPLOAD_SUCCESS = 'image uploaded successfully';
export const IMAGE_UPLOAD_FAILED = 'image upload failed';

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

// Streams
export const STREAM_NOT_FOUND = 'Stream with the provided ID does not exist';
export const CLASS_NOT_FOUND = 'Class with the provided ID does not exist';
export const STREAMS_RETRIEVED = 'Streams retrieved successfully';

// Invites
export const INVITE_SENT = 'invite sent';
export const PENDING_INVITES_FETCHED = 'Pending invites retrieved successfully';
export const NO_PENDING_INVITES = 'No pending invites found';
export const INVITE_ALREADY_SENT = 'invite already sent';
export const ACTIVE_INVITE_EXISTS = 'an active invite exist for this user';

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
export const INVALID_SESSION_ID = 'Invalid session ID provided.';
export const SESSION_ACTIVATED_SUCCESSFULLY =
  'Academic session activated successfully.';
export const SESSION_ACTIVATION_FAILED =
  'Failed to activate academic session. Please try again.';
export const ACADEMY_SESSION_ACTIVATED =
  'Academic session activated successfully.';
export const ACADEMIC_SESSION_RETRIEVED =
  'Academic session retrieved successfully.';
export const ACADEMIC_SESSION_UPDATED =
  'Academic session updated successfully.';
export const ACADEMIC_SESSION_DELETED =
  'Academic session deleted successfully.';
export const INACTIVE_SESSION_LOCKED =
  'Cannot modify an inactive academic session. Previous sessions are locked to preserve historical data integrity.';
export const ARCHIVED_SESSION_LOCKED =
  'Cannot modify an archived academic session. Archived sessions are read-only to preserve historical data.';
export const ARCHIVED_SESSION_NO_DELETE =
  'Cannot delete an archived academic session. Archived sessions must be preserved for historical records.';
export const ACTIVE_SESSION_NO_DELETE =
  'Cannot delete an active academic session. Please archive the session first before deletion.';
export const SESSION_ARCHIVED = 'Academic session archived successfully.';
export const ONGOING_SESSION_EXISTS =
  'Cannot create a new session while an ongoing session exists. Please wait for the current session to end.';
// Session management messages
export const SESSION_REVOKED = 'session revoked successfully';
export const SESSIONS_REVOKED = 'all user sessions revoked successfully';
export const SESSION_NOT_FOUND = 'session not found';
export const CANNOT_REVOKE_OTHER_SESSIONS = 'cannot revoke other user sessions';

// Room
export const ROOM_CREATED_SUCCESSFULLY = 'Room created successfully.';
export const DUPLICATE_ROOM_NAME = 'A room with this name already exists.';
export const ROOM_RETRIEVED_SUCCESSFULLY =
  'Room details retrieved successfully.';
export const ROOM_LIST_RETRIEVED_SUCCESSFULLY =
  'List of rooms retrieved successfully.';
export const ROOM_UPDATED_SUCCESSFULLY = 'Room updated successfully.';
export const ROOM_DELETED_SUCCESSFULLY = 'Room deleted successfully.';
export const ROOM_NOT_FOUND = 'Room not found.';
export const INVALID_ROOM_ID = 'Invalid room ID provided.';
export const ROOM_ASSIGNED_TO_CLASS = 'Room successfully assigned to class.';
export const ROOM_STATUS_UPDATED = 'Room status updated successfully.';
export const CANNOT_DELETE_OCCUPIED_ROOM =
  'Cannot delete a room that has an active class.';

// Subject messages
export const SUBJECT_CREATED = 'Subject created successfully';
export const SUBJECT_ALREADY_EXISTS = 'Subject already exists';
export const SUBJECTS_RETRIEVED = 'Subjects retrieved successfully';
export const SUBJECT_RETRIEVED = 'Subject retrieved successfully';
export const SUBJECT_NOT_FOUND = 'Subject not found';
export const SUBJECT_UPDATED = 'Subject updated successfully';
export const SUBJECT_DELETED = 'Subject deleted successfully';
export const SUBJECT_REQUIRED_FOR_LESSON = 'Subject is required for lessons';
export const CLASSES_ASSIGNED_TO_SUBJECT =
  'Classes successfully assigned to subject';

// School Installation messages
export const INSTALLATION_COMPLETED =
  'school installation completed successfully';
export const INSTALLATION_ALREADY_COMPLETED =
  'school installation already completed';
export const SCHOOL_NOT_FOUND = 'School not found';

// Classes
export const CLASS_OR_TEACHER_OR_SESSION_NOT_FOUND =
  'class, teacher, or session not found';
export const CLASS_ALREADY_HAS_TEACHER =
  'class already has a teacher assigned for this session';
export const TEACHER_ASSIGNED = 'teacher successfully assigned to the class';
export const CLASS_CREATED = 'Class successfully created.';
export const CLASS_ALREADY_EXIST =
  'A class with the same name and arm already exists in this session.';
export const CLASS_NAME_EMPTY = 'class name cannot be empty';
export const CLASS_UPDATED = 'class updated successfully';
export const CLASS_FETCHED = 'class fetched successfully';
export const TOTAL_CLASSES_FETCHED = 'total classes fetched successfully';
export const INVALID_CLASS_IDS = 'One or more class IDs are invalid';
export const CLASSES_NOT_IN_ACTIVE_SESSION =
  'One or more classes are not in the active academic session';
export const CLASS_SUBJECT_NOT_FOUND = 'Subject not found in class';
export const CLASS_SUBJECTS_FETCHED_SUCCESSFUL =
  'Class subjects fetched successfully';
export const CLASS_SUBJECT_ALREADY_HAS_A_TEACHER =
  'Teacher already assigned to this subject in this class';
export const TEACHER_NOT_ASSIGNED_TO_SUBJECT =
  'No teacher is assigned to this subject';
export const TEACHER_UNASSIGNED_FROM_SUBJECT =
  'Teacher successfully unassigned from this subject';
export const CLASS_DELETED = 'Class deleted successfully';
export const CANNOT_DELETE_PAST_SESSION_CLASS =
  'Only classes from the active session can be deleted.';

// Parent messages
export const PARENT_CREATED = 'Parent created successfully';
export const PARENT_UPDATED = 'Parent updated successfully';
export const PARENT_NOT_FOUND = 'Parent not found';
export const PARENTS_FETCHED = 'Parents fetched successfully';
export const PARENT_DELETED = 'Parent deleted successfully';
// Contact messages
export const CONTACT_MESSAGE_SENT = 'Contact message sent successfully';
export const CONTACT_MESSAGE_FAILED = 'Failed to send contact message';
export const CONTACT_NOT_FOUND = 'Contact inquiry not found';
export const CONTACT_ALREADY_RESOLVED = 'Contact inquiry already resolved';
export const CONTACT_STATUS_UPDATED = 'Contact status updated successfully';

// Database messages
export const DATABASE_CREATED = 'Database stored successfully';
export const DATABASE_ALREADY_CONFIGURED =
  'Database already configured for this school';
export const DATABASE_CONFIGURATION_FAILED = 'Database configuration failed';
export const DATABASE_CONFIGURATION_SUCCESS =
  'Database configuration successful';
export const DATABASE_CONFIGURATION_UPDATED =
  'Database configuration updated successfully';
// Student messages
export const STUDENT_CREATED = 'Student created successfully';
export const STUDENT_EMAIL_CONFLICT = `Student with email already exists.`;
export const STUDENT_REGISTRATION_NUMBER_CONFLICT = `Student with registration number already exists.`;
export const STUDENT_FETCHED = 'Student fetched successfully';
export const STUDENTS_FETCHED = 'Students fetched successfully';
export const STUDENT_NOT_FOUND = 'Student not found';
export const STUDENT_UPDATED = 'Student updated successfully';

//bulk upload message
export const BULK_UPLOAD_NO_NEW_EMAILS =
  'The Users with this email have received an invite before.';
export const BULK_UPLOAD_NOT_ALLOWED =
  'You are not permitted to perform a bulk upload.';
export const NO_BULK_UPLOAD_DATA = 'No data was provided for bulk upload.';
export const INVALID_BULK_UPLOAD_FILE =
  'The uploaded file is invalid or improperly formatted.';
export const BULK_UPLOAD_SUCCESS = 'Bulk upload completed successfully.';
export const STUDENT_DELETED = 'Student deleted successfully';

// Academic Term messages
export const TERM_RETRIEVED = 'Term(s) retrieved successfully';
export const TERM_UPDATED = 'Term updated successfully';
export const TERM_NOT_FOUND = 'Term not found';
export const TERM_UPDATE_FAILED = 'Failed to update term';
export const ARCHIVED_TERM_LOCKED =
  'Cannot modify an archived term. Archived terms are read-only to preserve historical data.';

// Academic Term - Validation errors
export const TERM_INVALID_DATE_RANGE = 'end date must be after start date';
export const TERM_START_AFTER_END =
  'Start date must be before the current end date';
export const TERM_END_BEFORE_START =
  'End date must be after the current start date';
export const TERM_SEQUENTIAL_INVALID =
  'start date must be after the previous term end date';
export const TERM_ID_INVALID = 'invalid term id';
// Dashboard messages
export const DASHBOARD_RESOLVED = 'Dashboard resolved successfully';

// Teacher messages
export const INVALID_TEACHER_ID = 'Invalid teacher ID provided';

// Timetable messages
export const TIMETABLE_CREATED = 'Timetable created successfully';
export const TIMETABLE_UPDATED = 'Timetable updated successfully';
export const TIMETABLE_DELETED = 'Timetable deleted successfully';
export const TIMETABLE_NOT_FOUND = 'Timetable not found';
export const TIMETABLE_FETCHED = 'Timetable fetched successfully';
export const TIMETABLES_FETCHED = 'Timetables fetched successfully';
export const INVALID_TIME_RANGE = 'Start time must be before end time';
export const TIMETABLE_OVERLAP_STREAM =
  'Timetable period overlaps with another period for the same stream on the same day';
export const TIMETABLE_TEACHER_DOUBLE_BOOKED =
  'Teacher is already scheduled for another class at this time';
export const TEACHER_NOT_FOUND = 'Teacher not found';
export const INVALID_DATE_RANGE_TIMETABLE =
  'End date must be after effective date';
export const TIMETABLE_ARCHIVED = 'Timetable archived successfully';
export const TIMETABLE_INTERNAL_OVERLAP =
  'Timetable contains overlapping schedules.';

// Fees messages
export const FEE_CREATED_SUCCESSFULLY = 'Fee component created successfully';
export const FEES_RETRIEVED_SUCCESSFULLY =
  'Fee components retrieved successfully';
export const FEE_RETRIEVED_SUCCESSFULLY =
  'Fee component retrieved successfully';
export const FEE_UPDATED_SUCCESSFULLY = 'Fee component updated successfully';
export const FEE_STATUS_UPDATED_SUCCESSFULLY =
  'Fee component status updated successfully';
export const FEE_NOT_FOUND = 'Fees component not found';

// Grade messages
export const GRADE_SUBMISSION_CREATED = 'Grade submission created successfully';
export const GRADE_SUBMISSION_UPDATED = 'Grade submission updated successfully';
export const GRADE_SUBMISSION_NOT_FOUND = 'Grade submission not found';
export const GRADE_SUBMISSION_EXISTS =
  'A grade submission already exists for this class, subject, and term';
export const GRADE_CREATED = 'Grade created successfully';
export const GRADE_UPDATED = 'Grade updated successfully';
export const GRADE_SUBMITTED = 'Grades submitted for approval successfully';
export const GRADE_APPROVED = 'Grades approved successfully';
export const GRADE_REJECTED = 'Grades rejected';
export const GRADE_UNLOCKED = 'Grades unlocked for editing';
export const GRADE_NOT_FOUND = 'Grade not found';
export const GRADES_FETCHED = 'Grades fetched successfully';
export const GRADE_ALREADY_APPROVED =
  'Cannot modify an approved grade submission';
export const GRADE_ALREADY_SUBMITTED =
  'Cannot modify a submitted grade submission. Wait for admin review.';
export const GRADE_NOT_SUBMITTED =
  'Grade submission must be submitted before approval';
export const GRADE_INCOMPLETE_SCORES =
  'All students must have complete CA and exam scores before submission';
export const GRADE_INVALID_STATUS_TRANSITION =
  'Invalid status transition for grade submission';
export const GRADE_TEACHER_NOT_ASSIGNED =
  'You are not assigned to teach this subject for this class';
export const TEACHER_PROFILE_NOT_FOUND =
  'Teacher profile not found. Please ensure your account is properly linked to a teacher profile.';
export const UNAUTHORIZED_GRADE_ACCESS =
  'You are not authorized to access this grade submission';
export const INVALID_SCORE_RANGE = 'Score must be within the allowed range';
export const FEE_DEACTIVATED_SUCCESSFULLY =
  'Fee component deactivated successfully';
export const FEE_ALREADY_INACTIVE = 'Fee component is already inactive';
// Superadmin messages
export const SUPERADMIN_ACCOUNT_CREATED = 'superadmin account created';
export const SUPERADMIN_PASSWORDS_REQUIRED =
  'password and confirmation password are required';
export const SUPERADMIN_INVALID_PASSWORD = 'invalid password';
export const SUPERADMIN_EMAIL_EXISTS =
  'superadmin with this email already exists';
export const SUPERADMIN_PASSWORD_MUST_MATCH =
  'password and confirmation password must match';
export const SUPERADMIN_CONFLICT_GENERAL_MSG =
  'conflict - request cannot be processed. See examples for possible causes.';
export const SUPERADMIN_ALREADY_EXISTS =
  'a superadmin account already exists. Only one is allowed.';
