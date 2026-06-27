const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../dist');
const destDir = path.join(__dirname, '../../backend/dist');

function copyFolderSync(from, to) {
  if (fs.existsSync(to)) {
    fs.rmSync(to, { recursive: true, force: true });
  }
  fs.mkdirSync(to, { recursive: true });
  
  fs.readdirSync(from).forEach(element => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  });
}

if (fs.existsSync(srcDir)) {
  console.log(`Copying ${srcDir} to ${destDir}...`);
  copyFolderSync(srcDir, destDir);
  console.log('✓ Successfully copied built files to backend/dist');
} else {
  console.error(`✗ Source directory does not exist: ${srcDir}`);
}
