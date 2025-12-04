import { Request } from 'express';

import { UserRole } from '../../modules/shared/enums';

export interface IRequestWithUser extends Request {
  user: {
    userId: string;
    role: UserRole;
  };
}
