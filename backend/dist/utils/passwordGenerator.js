"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomPassword = generateRandomPassword;
exports.isValidPhoneNumber = isValidPhoneNumber;
const crypto_1 = __importDefault(require("crypto"));
function generateRandomPassword(length = 8) {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    // Ensure at least one character from each type
    let password = '';
    password += lowercase[crypto_1.default.randomInt(0, lowercase.length)];
    password += uppercase[crypto_1.default.randomInt(0, uppercase.length)];
    password += numbers[crypto_1.default.randomInt(0, numbers.length)];
    // Fill the rest with random characters
    const allChars = lowercase + uppercase + numbers;
    for (let i = 3; i < length; i++) {
        password += allChars[crypto_1.default.randomInt(0, allChars.length)];
    }
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
}
function isValidPhoneNumber(phone) {
    // Rwandan phone number validation
    const rwandaPhoneRegex = /^\+250[7][0-9]{8}$/;
    return rwandaPhoneRegex.test(phone);
}
//# sourceMappingURL=passwordGenerator.js.map