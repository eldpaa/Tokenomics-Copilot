const fs = require('fs');
const path = require('path');

const dirsToDelete = [
  path.join(__dirname, 'frontend1', 'donttouch'),
  path.join(__dirname, 'frontend1', 'next-app')
];

for (const dir of dirsToDelete) {
  if (fs.existsSync(dir)) {
    console.log(`Deleting ${dir}...`);
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`Deleted ${dir}`);
  }
}
