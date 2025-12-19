import { HttpStatus, ForbiddenException } from '@nestjs/common';

import { BaseException } from './base-exception';

export class UserNotFoundException extends BaseException {
  constructor(userId: string) {
    super(`User with id ${userId} not found`, HttpStatus.NOT_FOUND);
  }
}

export class ForbiddenActionException extends BaseException {
  constructor(action: string) {
    super(`Forbidden to perform this action: ${action}`, HttpStatus.FORBIDDEN);
  }
}

export class CannotRevokeOtherSessionsException extends ForbiddenException {
  constructor(message?: string) {
    super(message);
  }
}

// TO DO: Add more domain exceptions here
