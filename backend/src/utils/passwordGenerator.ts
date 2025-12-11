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
  if (!phone || !phone.trim()) {
    return false;
  }

  const trimmedPhone = phone.trim();

  // Must start with + (country code required)
  if (!trimmedPhone.startsWith('+')) {
    return false;
  }

  // Extract country code and number
  const match = trimmedPhone.match(/^\+(\d{1,4})(.+)$/);
  if (!match) {
    return false;
  }

  const [, dialCode, number] = match;
  const digitsOnly = number.replace(/\D/g, '');

  // Basic validation: should have 7-15 digits (excluding country code)
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return false;
  }

  // Country-specific validation for Rwanda
  if (dialCode === '250') {
    // Rwanda: must be 9 digits starting with 7
    // Format: +2507XXXXXXXX (9 digits after country code)
    if (digitsOnly.length !== 9 || !digitsOnly.startsWith('7')) {
      return false;
    }
    // Validate full format: +2507XXXXXXXX
    return /^\+2507\d{8}$/.test(trimmedPhone.replace(/\s/g, ''));
  }

  // For other countries, validate general format
  // Remove spaces, hyphens, parentheses and check
  const cleaned = trimmedPhone.replace(/[\s\-()]/g, '');
  return /^\+\d{1,4}\d{7,15}$/.test(cleaned);
}