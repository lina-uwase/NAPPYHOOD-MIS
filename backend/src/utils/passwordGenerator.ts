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
  // Phone number validation - accepts with or without country code
  // Accepts: +2507xxxxxxxx or 07xxxxxxxx (Rwanda format)
  // Can be extended to support other country codes
  const phoneRegex = /^(\+[1-9][0-9]{0,3})?[0-9]{9,15}$/;

  // More specific validation for Rwanda numbers
  const rwandaWithCode = /^\+250[7][0-9]{8}$/;
  const rwandaWithoutCode = /^0[7][0-9]{8}$/;

  // Check if it matches general format first
  if (!phoneRegex.test(phone)) {
    return false;
  }

  // If it starts with +250 or 07, validate as Rwanda number
  if (phone.startsWith('+250')) {
    return rwandaWithCode.test(phone);
  } else if (phone.startsWith('07')) {
    return rwandaWithoutCode.test(phone);
  }

  // Allow other valid phone formats
  return true;
}