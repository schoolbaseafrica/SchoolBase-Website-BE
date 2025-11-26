import * as fs from 'fs';
import { join } from 'path';

import { Injectable, CanActivate, ForbiddenException } from '@nestjs/common';

@Injectable()
export class SetupGuard implements CanActivate {
  canActivate(): boolean {
    const envPath = join(process.cwd(), '.env');

    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');

      // check if setup is already completed
      const setupCompletedRegex = /SETUP_COMPLETED\s*=\s*['"]?true['"]?/i;

      if (setupCompletedRegex.test(envContent)) {
        throw new ForbiddenException(
          'Setup has already been completed. Cannot run setup again.',
        );
      }
    }

    return true;
  }
}
