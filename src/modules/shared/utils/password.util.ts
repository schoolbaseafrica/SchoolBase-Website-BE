export function generateTempPassword(): string {
  return Math.random().toString(36).slice(-10);
}

export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcrypt');
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export function generateStrongPassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const allChars = uppercase + lowercase + numbers;

  let password = '';
  // Ensure at least one character from each set
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}
