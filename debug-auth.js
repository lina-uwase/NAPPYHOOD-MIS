const fs = require('fs');
const path = '/app/src/controllers/authController.ts';

console.log('🚨 ADDING DEBUG LOGGING TO AUTH CONTROLLER');

let content = fs.readFileSync(path, 'utf8');

// Add debug logging before the validation
const beforeValidation = `console.log('🔍 DEBUG: Checking phone validation for:', phone);
    console.log('🔍 DEBUG: About to run phone validation with isActive filter');

    // Check if user already exists by phone or email (only among active users)`;

content = content.replace(
  '// Check if user already exists by phone or email (only among active users)',
  beforeValidation
);

// Add debug logging after the validation
const afterValidation = `console.log('🔍 DEBUG: Validation result:', existingUser ? 'FOUND CONFLICT' : 'NO CONFLICT');
    if (existingUser) {
      console.log('🔍 DEBUG: Conflicting user:', existingUser.name, 'isActive:', existingUser.isActive);
    }

    if (existingUser) {`;

content = content.replace(
  'if (existingUser) {',
  afterValidation
);

fs.writeFileSync(path, content);
console.log('✅ DEBUG LOGGING ADDED TO AUTH CONTROLLER');
console.log('🔄 Now restart backend to see debug output...');