const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '../..');
const frontendDir = path.join(__dirname, '..');
const applicationDir = path.join(rootDir, 'application');

// Ensure root 'application' directory exists
if (!fs.existsSync(applicationDir)) {
  fs.mkdirSync(applicationDir, { recursive: true });
  console.log(`Created directory: ${applicationDir}`);
}

const type = process.argv[2]; // 'android', 'windows', or 'both'

function copyAndroid() {
  const packageJsonPath = path.join(frontendDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const version = packageJson.version || '1.0.0';

  const sourceApk = path.join(frontendDir, 'android/app/build/outputs/apk/debug/app-debug.apk');
  const destApk = path.join(applicationDir, `Axon-${version}.apk`);
  const destApkGeneric = path.join(applicationDir, 'Axon.apk');
  
  if (fs.existsSync(sourceApk)) {
    fs.copyFileSync(sourceApk, destApk);
    console.log(`✓ Copied APK to ${destApk}`);
    fs.copyFileSync(sourceApk, destApkGeneric);
    console.log(`✓ Copied APK to ${destApkGeneric}`);
  } else {
    console.error(`✗ Source APK not found at: ${sourceApk}`);
  }
}

function copyWindows() {
  const packageJsonPath = path.join(frontendDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const version = packageJson.version || '1.0.0';

  const distElectronDir = path.join(frontendDir, 'dist_electron');
  
  const setupFile = `Axon Setup ${version}.exe`;
  const portableFile = `Axon ${version}.exe`;

  const sourceSetup = path.join(distElectronDir, setupFile);
  const sourcePortable = path.join(distElectronDir, portableFile);

  const destSetup = path.join(applicationDir, `Axon-Setup-${version}.exe`);
  const destPortable = path.join(applicationDir, `Axon-${version}.exe`);

  let copied = false;
  if (fs.existsSync(sourceSetup)) {
    fs.copyFileSync(sourceSetup, destSetup);
    console.log(`✓ Copied Windows Installer to ${destSetup}`);
    copied = true;
  }
  
  if (fs.existsSync(sourcePortable)) {
    fs.copyFileSync(sourcePortable, destPortable);
    console.log(`✓ Copied Windows Portable to ${destPortable}`);
    copied = true;
  }

  if (!copied) {
    console.error(`✗ No Windows EXE found in: ${distElectronDir}`);
  }
}

if (type === 'android') {
  copyAndroid();
} else if (type === 'windows') {
  copyWindows();
} else if (type === 'both') {
  copyAndroid();
  copyWindows();
} else {
  console.log('Usage: node copy-builds.cjs [android|windows|both]');
}
