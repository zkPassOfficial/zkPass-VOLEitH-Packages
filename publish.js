#!/usr/bin/env node
// Publish all packages in this repository at one version, dependencies first.
//
//   node publish.js            publish the packages not yet on npm at this version
//   node publish.js --dry-run  pack everything and list the contents, upload nothing
//
// Everything is packed and checked before the first upload. A package already on npm with the
// same tarball is skipped, so an interrupted run can be repeated.
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const unknown = args.filter((a) => a !== '--dry-run');
if (unknown.length) {
  console.error(`unknown argument ${unknown.join(' ')}\nusage: node publish.js [--dry-run]`);
  process.exit(2);
}

const rootDir = __dirname;

// in publish order, dependencies first
const packages = [
  ['@zkpass/vole-node-darwin-arm64', 'vole-node-darwin-arm64'],
  ['@zkpass/vole-node-darwin-x64', 'vole-node-darwin-x64'],
  ['@zkpass/vole-node-linux-arm64-gnu', 'vole-node-linux-arm64-gnu'],
  ['@zkpass/vole-node-linux-x64-gnu', 'vole-node-linux-x64-gnu'],
  ['@zkpass/vole-node-win32-x64-msvc', 'vole-node-win32-x64-msvc'],
  ['@zkpass/wasm-lib-node', 'wasm'],
  ['@zkpass/vole-node', 'node-addons'],
  ['@zkpass/wasm-lib-web', 'wasm-web'],
  ['@zkpass/wasm-lib-worker', 'wasm-worker'],
];

// Run the npm CLI through node, not through a shell, so paths are passed as they are.
const npmCli = [
  path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'),
  path.join(path.dirname(process.execPath), '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
].find((p) => fs.existsSync(p));
if (!npmCli && process.platform === 'win32') {
  throw new Error(`npm-cli.js not found next to ${process.execPath}`);
}

function runNpm(argv, options) {
  if (npmCli) return execFileSync(process.execPath, [npmCli, ...argv], options);
  return execFileSync('npm', argv, options);
}

function npm(argv, options = {}) {
  return runNpm(argv, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'], ...options });
}

const manifests = packages.map(([name, dir]) => {
  const pkgJson = JSON.parse(fs.readFileSync(path.join(rootDir, dir, 'package.json'), 'utf-8'));
  if (pkgJson.name !== name) {
    throw new Error(`${dir}/package.json is ${pkgJson.name}, expected ${name}`);
  }
  if (pkgJson.publishConfig?.access !== 'public') {
    throw new Error(`${name}: publishConfig.access must be "public"`);
  }
  return { name, dir, version: pkgJson.version, deps: pkgJson.optionalDependencies ?? {} };
});

const versions = [...new Set(manifests.map((m) => m.version))];
if (versions.length !== 1) {
  const list = manifests.map((m) => `  ${m.name} ${m.version}`).join('\n');
  throw new Error(`package versions differ:\n${list}`);
}
const [version] = versions;

for (const m of manifests) {
  for (const [dep, pinned] of Object.entries(m.deps)) {
    if (pinned !== version) {
      throw new Error(`${m.name} pins ${dep}@${pinned}, expected ${version}`);
    }
    if (!packages.some(([name]) => name === dep)) {
      throw new Error(`${m.name} depends on ${dep}, which is not published from here`);
    }
  }
}

if (!dryRun) {
  try {
    console.log(`npm user: ${npm(['whoami']).trim()}`);
  } catch {
    throw new Error('not logged in to npm');
  }
}

const packDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zkpass-voleith-packages-'));
process.on('exit', () => fs.rmSync(packDir, { recursive: true, force: true }));

console.log(`${dryRun ? 'Dry run: packing' : 'Packing'} ${manifests.length} packages at ${version}`);
for (const m of manifests) {
  const packArgs = ['pack', '--json', '--pack-destination', packDir];
  if (dryRun) packArgs.push('--dry-run');
  const [info] = JSON.parse(npm(packArgs, { cwd: path.join(rootDir, m.dir) }));
  m.tarball = path.join(packDir, info.filename);
  m.shasum = info.shasum;
  console.log(`== ${m.name}@${version}: ${info.files.length} files, ${info.size} bytes, shasum ${m.shasum}`);
  for (const file of info.files) {
    console.log(`   ${file.path}`);
  }
}

// The shasum of the tarball on npm at this version, or null if there is none.
function publishedShasum(name) {
  try {
    return JSON.parse(npm(['view', `${name}@${version}`, 'dist.shasum', '--json']));
  } catch (error) {
    if (/E404/.test(`${error.stdout}\n${error.stderr}`)) return null;
    throw error;
  }
}

const conflicts = [];
for (const m of manifests) {
  m.publishedShasum = publishedShasum(m.name);
  if (m.publishedShasum && m.publishedShasum !== m.shasum) conflicts.push(m);
}
if (conflicts.length) {
  const list = conflicts
    .map((m) => `  ${m.name}@${version}: npm ${m.publishedShasum}, local ${m.shasum}`)
    .join('\n');
  throw new Error(`already published with different contents, bump the version:\n${list}`);
}

const pending = [];
for (const m of manifests) {
  if (m.publishedShasum) {
    console.log(`-- ${m.name}@${version} is already on npm, skipping`);
  } else {
    pending.push(m);
  }
}

if (dryRun) {
  console.log(`Dry run complete, ${pending.length} of ${manifests.length} packages would be published.`);
  process.exit(0);
}
if (!pending.length) {
  console.log(`All ${manifests.length} packages are already on npm at ${version}.`);
  process.exit(0);
}

console.log(`Publishing ${pending.length} packages`);
for (const m of pending) {
  console.log(`== ${m.name}@${version}`);
  runNpm(['publish', m.tarball], { cwd: path.join(rootDir, m.dir), stdio: 'inherit' });
}
console.log(`Published ${pending.length} packages at ${version}.`);
