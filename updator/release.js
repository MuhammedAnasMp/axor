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
  const frontendDir = path.join(__dirname, '..', 'frontend');
  const packageJsonPath = path.join(frontendDir, 'package.json');
  
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
  const buildSuccess = runCommand('npx vite build', { cwd: frontendDir });
  if (!buildSuccess) {
    console.error('❌ Build failed. Restoring original version...');
    packageJson.version = oldVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
    process.exit(1);
  }

  // 5. Zip dist/ contents using native Windows PowerShell Compress-Archive
  console.log('🤐 Zipping web assets...');
  const zipPath = path.join(frontendDir, 'ota_update.zip');
  
  // Remove existing zip if any
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  const isWindows = process.platform === 'win32';
  const zipSuccess = isWindows
    ? runCommand(`powershell -Command "Compress-Archive -Path dist\\* -DestinationPath ota_update.zip -Force"`, { cwd: frontendDir })
    : runCommand(`zip -r ../ota_update.zip .`, { cwd: path.join(frontendDir, 'dist') });

  if (!zipSuccess || !fs.existsSync(zipPath)) {
    console.error('❌ Failed to zip dist/ contents.');
    process.exit(1);
  }

  // 6. Run Django database registration scripts
  console.log('💾 Registering bundle in Django databases...');
  let pythonCmd = 'python';
  const venvPythonPath = path.join(__dirname, '..', 'backend', 'venv', 'Scripts', 'python.exe');
  if (fs.existsSync(venvPythonPath)) {
    pythonCmd = `"${venvPythonPath}"`;
  }
  
  // Register in LOCAL database
  console.log('Registering in LOCAL database...');
  const localRegisterSuccess = runCommand(
    `${pythonCmd} "${path.join(__dirname, 'register_ota.py')}" ${newVersion} "${zipPath}"`,
    { cwd: __dirname }
  );

  // Register in PRODUCTION database (Neon)
  console.log('Registering in PRODUCTION Neon database...');
  const prodRegisterSuccess = runCommand(
    `${pythonCmd} "${path.join(__dirname, 'register_ota.py')}" ${newVersion} "${zipPath}" --prod`,
    { cwd: __dirname }
  );

  // 7. Cleanup temp zip file
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  if (localRegisterSuccess && prodRegisterSuccess) {
    console.log(`\n🎉 Success! OTA Update Bundle v${newVersion} is registered in testing mode on both LOCAL and PRODUCTION.\n`);

    // 8. Git commit and push changes
    console.log('🐙 Staging changes and committing to Git...');
    const rootDir = path.join(__dirname, '..');
    const gitAddSuccess = runCommand('git add .', { cwd: rootDir });
    if (gitAddSuccess) {
      const commitMessage = `release: UI update v${newVersion}`;
      const gitCommitSuccess = runCommand(`git commit -m "${commitMessage}"`, { cwd: rootDir });
      if (gitCommitSuccess) {
        console.log('Pushing changes to GitHub...');
        let branch = 'master';
        try {
          branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: rootDir }).toString().trim();
        } catch (e) {
          console.warn('Failed to detect current branch name, defaulting to master.');
        }
        const gitPushSuccess = runCommand(`git push origin ${branch}`, { cwd: rootDir });
        if (gitPushSuccess) {
          console.log(`\n✅ Successfully pushed v${newVersion} to GitHub on branch ${branch}!\n`);
        } else {
          console.error('\n❌ Git push failed.\n');
        }
      } else {
        console.warn('\n⚠️ Git commit failed or nothing to commit.\n');
      }
    } else {
      console.error('\n❌ Git add failed.\n');
    }
  } else {
    console.error('\n❌ Failed to register update in one or both databases.\n');
    process.exit(1);
  }
}

main();
