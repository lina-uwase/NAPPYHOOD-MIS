const { Client } = require('ssh2');

const passwords = ['HODW23@12cnidnoiwe!2132', 'GettingRich@2030!'];
const host = '41.186.186.178';
const user = 'root';

async function tryPassword(password) {
  return new Promise((resolve) => {
    const conn = new Client();
    conn.on('ready', () => {
      console.log(`Connected with password: ${password}`);
      conn.exec('cat /app/.env || cat /root/NAPPYHOOD-MIS/.env || cat /root/NAPPYHOOD-MIS/backend/.env || cat /root/nappyhood-mis/.env || find / -name ".env*" -maxdepth 4 -exec cat {} +', (err, stream) => {
        if (err) {
          console.error(err);
          return resolve(false);
        }
        let output = '';
        stream.on('close', (code, signal) => {
          console.log('\n--- ENV CONTENTS ---\n');
          console.log(output);
          console.log('\n--------------------\n');
          conn.end();
          resolve(true);
        }).on('data', (data) => {
          output += data;
        }).stderr.on('data', (data) => {
          console.log('STDERR: ' + data);
        });
      });
    }).on('error', (err) => {
      // Ignore auth errors, we'll just try the next one
      resolve(false);
    }).connect({
      host: host,
      port: 22,
      username: user,
      password: password,
      readyTimeout: 10000
    });
  });
}

async function run() {
  for (const pw of passwords) {
    const success = await tryPassword(pw);
    if (success) return;
  }
  console.log('All passwords failed');
}

run();
