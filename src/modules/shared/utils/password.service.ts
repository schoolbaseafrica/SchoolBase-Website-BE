import { Injectable } from '@nestjs/common';

import { GeneratePasswordResponseDto } from './generate-password-response.dto';
import { generateStrongPassword } from './password.util';

@Injectable()
export class PasswordService {
  generatePassword(): GeneratePasswordResponseDto {
    const password = generateStrongPassword(12);

    // Determine password strength (simple check)
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const strengthCount = [hasUpper, hasLower, hasNumber].filter(
      Boolean,
    ).length;

    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    if (strengthCount === 3 && password.length >= 12) {
      strength = 'strong';
    } else if (strengthCount >= 2) {
      strength = 'medium';
    }

    return { password, strength };
  }
}
