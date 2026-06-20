import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, '..');
const frontendDir = path.join(__dirname, '..', 'frontend');
const packageJsonPath = path.join(frontendDir, 'package.json');

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

function getPythonCmd() {
  const venvPythonPath = path.join(__dirname, '..', 'backend', 'venv', 'Scripts', 'python.exe');
  return fs.existsSync(venvPythonPath) ? `"${venvPythonPath}"` : 'python';
}

function getVersion() {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.version || '1.0.0';
}

function gitPush(version) {
  console.log('\n🐙 Staging changes and committing to Git...');
  const gitAddSuccess = runCommand('git add .', { cwd: rootDir });
  if (!gitAddSuccess) { console.error('❌ Git add failed.'); return; }

  const commitMessage = `release: UI update v${version}`;
  const gitCommitSuccess = runCommand(`git commit -m "${commitMessage}"`, { cwd: rootDir });
  if (!gitCommitSuccess) { console.warn('⚠️ Git commit failed or nothing to commit.'); return; }

  let branch = 'master';
  try {
    branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: rootDir }).toString().trim();
  } catch (e) { /* default to master */ }

  const gitPushSuccess = runCommand(`git push origin ${branch}`, { cwd: rootDir });
  if (gitPushSuccess) {
    console.log(`\n✅ Successfully pushed v${version} to GitHub on branch ${branch}!\n`);
  } else {
    console.error('\n❌ Git push failed.\n');
  }
}

function cmdBuild({ withPush = false } = {}) {
  if (!fs.existsSync(packageJsonPath)) {
    console.error('package.json not found in frontend directory.');
    process.exit(1);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const oldVersion = packageJson.version || '0.0.0';

  const versionParts = oldVersion.split('.');
  if (versionParts.length === 3) {
    versionParts[2] = String(parseInt(versionParts[2], 10) + 1);
  } else {
    versionParts[0] = '1'; versionParts[1] = '0'; versionParts[2] = '0';
  }
  const newVersion = versionParts.join('.');

  console.log(`\n🚀 Releasing OTA Update: v${oldVersion} -> v${newVersion}\n`);

  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');

  console.log('📦 Compiling frontend assets...');
  const buildSuccess = runCommand('npx vite build', { cwd: frontendDir });
  if (!buildSuccess) {
    console.error('❌ Build failed. Restoring original version...');
    packageJson.version = oldVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
    process.exit(1);
  }

  console.log('🤐 Zipping web assets with Capgo CLI...');
  const defaultZipName = `com.axor.app_${newVersion}.zip`;
  const defaultZipPath = path.join(frontendDir, defaultZipName);
  const zipPath = path.join(frontendDir, 'ota_update.zip');

  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  if (fs.existsSync(defaultZipPath)) fs.unlinkSync(defaultZipPath);

  const zipSuccess = runCommand(`npx @capgo/cli bundle zip com.axor.app --path ./dist`, { cwd: frontendDir });
  if (zipSuccess && fs.existsSync(defaultZipPath)) fs.renameSync(defaultZipPath, zipPath);
  if (!fs.existsSync(zipPath)) {
    console.error('❌ Failed to zip dist/ contents using Capgo CLI.');
    process.exit(1);
  }

  console.log('💾 Registering bundle in Django databases...');
  const pythonCmd = getPythonCmd();

  console.log('Registering in LOCAL database...');
  const localOk = runCommand(
    `${pythonCmd} "${path.join(__dirname, 'register_ota.py')}" ${newVersion} "${zipPath}"`,
    { cwd: __dirname }
  );

  console.log('Registering in PRODUCTION Neon database...');
  const prodOk = runCommand(
    `${pythonCmd} "${path.join(__dirname, 'register_ota.py')}" ${newVersion} "${zipPath}" --prod`,
    { cwd: __dirname }
  );

  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

  if (localOk && prodOk) {
    console.log(`\n🎉 OTA Bundle v${newVersion} registered in TESTING mode on LOCAL + PRODUCTION.\n`);
    if (withPush) gitPush(newVersion);
  } else {
    console.error('\n❌ Failed to register update in one or both databases.\n');
    process.exit(1);
  }
}

function cmdPublish() {
  const version = getVersion();
  const pythonCmd = getPythonCmd();
  console.log(`\n📢 Publishing v${version} to ALL users (removing testing gate)...\n`);

  runCommand(`${pythonCmd} "${path.join(__dirname, 'approve_ota.py')}" ${version}`, { cwd: __dirname });
  runCommand(`${pythonCmd} "${path.join(__dirname, 'approve_ota.py')}" ${version} --prod`, { cwd: __dirname });

  console.log(`\n✅ v${version} is now live for all users!\n`);
}

function cmdRemove() {
  const version = getVersion();
  const pythonCmd = getPythonCmd();
  console.log(`\n🗑️  Removing testing bundle v${version} from databases...\n`);

  runCommand(`${pythonCmd} "${path.join(__dirname, 'remove_ota.py')}" ${version}`, { cwd: __dirname });
  runCommand(`${pythonCmd} "${path.join(__dirname, 'remove_ota.py')}" ${version} --prod`, { cwd: __dirname });

  console.log(`\n✅ Testing bundle v${version} removed.\n`);
}

// --- Entry Point ---
const args = process.argv.slice(2).filter(a => a !== '--ui-only');
const subcommand = args[0];

if (subcommand === 'push') {
  cmdBuild({ withPush: true });
} else if (subcommand === 'publish') {
  cmdPublish();
} else if (subcommand === 'remove') {
  cmdRemove();
} else {
  // Default: build only, no git push
  cmdBuild({ withPush: false });
}
