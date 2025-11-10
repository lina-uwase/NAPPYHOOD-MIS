const fs = require('fs');
const path = '/app/dist/controllers/authController.js';

console.log('🔧 FIXING COMPILED JAVASCRIPT - THE REAL CULPRIT!');

let content = fs.readFileSync(path, 'utf8');
console.log('📁 Loaded compiled JavaScript file');

// Show the current problematic line
const lines = content.split('\n');
for (let i = 110; i <= 120; i++) {
  if (lines[i-1]) {
    console.log(`${i}: ${lines[i-1]}`);
  }
}

// Replace the problematic validation
const searchPattern = `            where: {
                OR: [`;

const replacePattern = `            where: {
                isActive: true,
                OR: [`;

if (content.includes('isActive: true')) {
  console.log('✅ isActive filter already exists in compiled code');
} else {
  content = content.replace(searchPattern, replacePattern);
  fs.writeFileSync(path, content);
  console.log('🎯 FIXED! Added isActive: true to compiled JavaScript');
  console.log('✅ Phone validation now only checks ACTIVE users in the actual running code!');
}

console.log('🔄 Backend needs restart to reload the fixed compiled code...');