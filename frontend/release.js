import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runCommand(command, options = {}) {
  try {
    execSync(command, { stdio: 'inherit', ...options });
    return true;
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.message);
    return false;
  }
}

function main() {
  const packageJsonPath = path.join(__dirname, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.error('package.json not found in frontend directory.');
    process.exit(1);
  }

  // 1. Read package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const oldVersion = packageJson.version || '0.0.0';
  
  // 2. Increment patch version (e.g., 1.0.2 -> 1.0.3)
  const versionParts = oldVersion.split('.');
  if (versionParts.length === 3) {
    versionParts[2] = String(parseInt(versionParts[2], 10) + 1);
  } else {
    versionParts[0] = '1';
    versionParts[1] = '0';
    versionParts[2] = '0';
  }
  const newVersion = versionParts.join('.');
  
  console.log(`\n🚀 Releasing OTA Update: v${oldVersion} -> v${newVersion}\n`);

  // 3. Update package.json
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');

  // 4. Run Vite build (compiles react app with injected __APP_VERSION__)
  console.log('📦 Compiling frontend assets...');
  const buildSuccess = runCommand('npx vite build', { cwd: __dirname });
  if (!buildSuccess) {
    console.error('❌ Build failed. Restoring original version...');
    packageJson.version = oldVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
    process.exit(1);
  }

  // 5. Zip dist/ contents using native Windows PowerShell Compress-Archive
  console.log('🤐 Zipping web assets...');
  const zipPath = path.join(__dirname, 'ota_update.zip');
  
  // Remove existing zip if any
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  const isWindows = process.platform === 'win32';
  const zipSuccess = isWindows
    ? runCommand(`powershell -Command "Compress-Archive -Path dist\\* -DestinationPath ota_update.zip -Force"`, { cwd: __dirname })
    : runCommand(`zip -r ../ota_update.zip .`, { cwd: path.join(__dirname, 'dist') });

  if (!zipSuccess || !fs.existsSync(zipPath)) {
    console.error('❌ Failed to zip dist/ contents.');
    process.exit(1);
  }

  const uiOnly = process.argv.includes('--ui-only');
  if (uiOnly) {
    console.log(`\n🎉 Success! UI update zip created at: ${zipPath}\n`);
    return;
  }

  // 6. Run Django database registration script
  console.log('💾 Registering bundle in Django backend...');
  let pythonCmd = 'python';
  const venvPythonPath = path.join(__dirname, '..', 'backend', 'venv', 'Scripts', 'python.exe');
  if (fs.existsSync(venvPythonPath)) {
    pythonCmd = `"${venvPythonPath}"`;
  }
  const registerSuccess = runCommand(
    `${pythonCmd} ../backend/register_ota.py ${newVersion} ota_update.zip`,
    { cwd: __dirname }
  );

  // 7. Cleanup temp zip file
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  if (registerSuccess) {
    console.log(`\n🎉 Success! OTA Update Bundle v${newVersion} is published and active.\n`);
  } else {
    console.error('\n❌ Failed to register update in database.\n');
    process.exit(1);
  }
}

main();
