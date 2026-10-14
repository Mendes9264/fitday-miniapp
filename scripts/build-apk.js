const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const tools = path.join(root, '.build-tools');
const env = { ...process.env };
const portableJdkRoot = path.join(tools, 'jdk');
if (!env.JAVA_HOME && fs.existsSync(portableJdkRoot)) {
  const candidates = fs.readdirSync(portableJdkRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && fs.existsSync(path.join(portableJdkRoot, entry.name, 'bin', 'java.exe')));
  const jdk = candidates.find(entry => /^jdk-21[.-]/.test(entry.name)) || candidates.find(entry => /^jdk-2[2-9][.-]/.test(entry.name));
  if (jdk) env.JAVA_HOME = path.join(portableJdkRoot, jdk.name);
}
const portableSdk = path.join(tools, 'android-sdk');
if (!env.ANDROID_HOME && fs.existsSync(path.join(portableSdk, 'platforms', 'android-36'))) env.ANDROID_HOME = portableSdk;
if (!env.JAVA_HOME || !env.ANDROID_HOME) {
  process.stderr.write('需要 JDK 21 和 Android SDK 36；请安装构建工具或将便携版放入 .build-tools。\n');
  process.exit(1);
}
env.ANDROID_SDK_ROOT = env.ANDROID_HOME;
env.PATH = path.join(env.JAVA_HOME, 'bin') + path.delimiter + env.PATH;
if (env.ANDROID_HOME === portableSdk) env.GRADLE_USER_HOME = path.join(tools, 'gradle-home');

function run(command, args, cwd, shell = false) {
  const result = spawnSync(command, args, { cwd, env, stdio: 'inherit', shell });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
run(process.execPath, [path.join(root, 'scripts', 'build-android-web.js')], root);
run(process.execPath, [path.join(root, 'node_modules', '@capacitor', 'cli', 'bin', 'capacitor'), 'sync', 'android'], root);
run(path.join(root, 'android', process.platform === 'win32' ? 'gradlew.bat' : 'gradlew'), ['assembleDebug'], path.join(root, 'android'), process.platform === 'win32');
const apk = path.join(root, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
if (!fs.existsSync(apk)) throw new Error('Gradle 完成，但未找到调试 APK');
process.stdout.write(`APK: ${apk} (${(fs.statSync(apk).size / 1024 / 1024).toFixed(1)} MB)\n`);
