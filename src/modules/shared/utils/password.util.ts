export function generateTempPassword(): string {
  return Math.random().toString(36).slice(-10);
}

export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcrypt');
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}
