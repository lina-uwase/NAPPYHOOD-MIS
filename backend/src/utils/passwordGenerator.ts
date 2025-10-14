import crypto from 'crypto';

export function generateRandomPassword(length: number = 8): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';

  // Ensure at least one character from each type
  let password = '';
  password += lowercase[crypto.randomInt(0, lowercase.length)];
  password += uppercase[crypto.randomInt(0, uppercase.length)];
  password += numbers[crypto.randomInt(0, numbers.length)];

  // Fill the rest with random characters
  const allChars = lowercase + uppercase + numbers;
  for (let i = 3; i < length; i++) {
    password += allChars[crypto.randomInt(0, allChars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export function isValidPhoneNumber(phone: string): boolean {
  // Rwandan phone number validation
  const rwandaPhoneRegex = /^\+250[7][0-9]{8}$/;
  return rwandaPhoneRegex.test(phone);
}