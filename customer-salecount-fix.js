const fs = require('fs');
const path = '/app/dist/controllers/customerController.js';

console.log('🔧 FIXING CUSTOMER VISIT TRACKING - ADD SALECOUNT SUPPORT');

let content = fs.readFileSync(path, 'utf8');

// Fix 1: Add saleCount to destructuring
const oldDestructuring = `let { fullName, gender, location, district, province, birthDay, birthMonth, birthYear, isDependent, parentId } = req.body;`;
const newDestructuring = `let { fullName, gender, location, district, province, birthDay, birthMonth, birthYear, isDependent, parentId, saleCount } = req.body;`;

content = content.replace(oldDestructuring, newDestructuring);

// Fix 2: Add saleCount to customer creation
const oldCreate = `const customer = await database_1.prisma.customer.create({
            data: {
                fullName,
                gender,
                location,
                district,
                province,
                phone: phone || null,
                email: email || null,
                birthDay: parseInt(birthDay),
                birthMonth: parseInt(birthMonth),
                birthYear: birthYear ? parseInt(birthYear) : null,
                isDependent: isDependent || false,
                parentId: isDependent ? parentId : null
            }
        });`;

const newCreate = `const customer = await database_1.prisma.customer.create({
            data: {
                fullName,
                gender,
                location,
                district,
                province,
                phone: phone || null,
                email: email || null,
                birthDay: parseInt(birthDay),
                birthMonth: parseInt(birthMonth),
                birthYear: birthYear ? parseInt(birthYear) : null,
                isDependent: isDependent || false,
                parentId: isDependent ? parentId : null,
                saleCount: saleCount ? parseInt(saleCount) : 0
            }
        });`;

content = content.replace(oldCreate, newCreate);

fs.writeFileSync(path, content);

console.log('✅ CUSTOMER VISIT TRACKING FIXED!');
console.log('📊 Added saleCount parameter extraction from request body');
console.log('📊 Added saleCount field to customer creation with default value 0');
console.log('🎯 Now first-time customers get saleCount: 0, returning customers get their visit count');
console.log('🔄 Backend needs restart to load the changes...');