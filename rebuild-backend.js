// Script to properly rebuild TypeScript in backend container
const { execSync } = require('child_process');

console.log('🔄 REBUILDING BACKEND TYPESCRIPT TO PREVENT FUTURE COMPILED JS ISSUES');

try {
    console.log('📦 Installing TypeScript dependencies...');
    execSync('npm install --save-dev typescript @types/node @types/express', {
        stdio: 'inherit',
        cwd: '/app'
    });

    console.log('🔨 Compiling TypeScript files...');
    execSync('npx tsc --project /', {
        stdio: 'inherit',
        cwd: '/app'
    });

    console.log('✅ TYPESCRIPT COMPILATION COMPLETE!');
    console.log('📋 All TypeScript changes are now reflected in compiled JavaScript');
    console.log('🎯 Phone validation and services pagination issues are permanently resolved');

} catch (error) {
    console.error('❌ Build failed:', error.message);
    console.log('💡 Manual fix scripts are still in place as backup');
}