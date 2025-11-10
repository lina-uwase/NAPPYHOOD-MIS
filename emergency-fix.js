const fs = require('fs');
const path = '/app/src/controllers/authController.ts';

console.log('🚨 EMERGENCY FIX: Replacing phone validation code');

// Read the file
let content = fs.readFileSync(path, 'utf8');

// Find the problematic validation and replace it
const oldValidation = `// Check if user already exists by phone or email
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          phone ? { phone } : {},
          email ? { email } : {}
        ].filter(condition => Object.keys(condition).length > 0)
      }
    });`;

const newValidation = `// Check if user already exists by phone or email (only among active users)
    const existingUser = await prisma.user.findFirst({
      where: {
        isActive: true,
        OR: [
          phone ? { phone } : {},
          email ? { email } : {}
        ].filter(condition => Object.keys(condition).length > 0)
      }
    });`;

// Replace it
content = content.replace(oldValidation, newValidation);

// Also handle any other pattern that might exist
const pattern1 = /const existingUser = await prisma\.user\.findFirst\(\{\s*where:\s*\{\s*OR:/;
if (pattern1.test(content) && !content.includes('isActive: true,')) {
  content = content.replace(
    /const existingUser = await prisma\.user\.findFirst\(\{\s*where:\s*\{/,
    'const existingUser = await prisma.user.findFirst({\n      where: {\n        isActive: true,'
  );
}

// Write back
fs.writeFileSync(path, content);

console.log('✅ EMERGENCY FIX APPLIED!');
console.log('📋 Phone validation now only checks ACTIVE users');
console.log('🔄 Backend needs restart to reload TypeScript...');