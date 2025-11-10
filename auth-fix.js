// Direct JavaScript fix for phone validation
const fs = require('fs');
const path = '/app/src/controllers/authController.ts';

// Read current file
let content = fs.readFileSync(path, 'utf8');

// Replace the validation logic with the correct one
const oldPattern = /\/\/ Check if user already exists by phone or email[\s\S]*?const existingUser = await prisma\.user\.findFirst\(\{[\s\S]*?\}\);/;

const newPattern = `// Check if user already exists by phone or email (only among active users)
    const existingUser = await prisma.user.findFirst({
      where: {
        isActive: true,
        OR: [
          phone ? { phone } : {},
          email ? { email } : {}
        ].filter(condition => Object.keys(condition).length > 0)
      }
    });`;

content = content.replace(oldPattern, newPattern);

// Force write the file
fs.writeFileSync(path, content);
console.log('✅ Phone validation fix applied to authController.ts');
console.log('Now only active users will be checked for phone number conflicts');
process.exit(0);