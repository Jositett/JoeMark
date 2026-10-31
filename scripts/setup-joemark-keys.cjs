#!/usr/bin/env node
'use strict';
/**
 * scripts/setup-joemark-keys.cjs
 * Generates a fresh Tauri v2 Updater signing keypair in ~/.tauri/tizu-updater.key
 * and automatically writes the new public key into src-tauri/tauri.conf.json.
 *
 * Usage:
 *   node scripts/setup-joemark-keys.cjs [optional-password]
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TAURI_CONF = path.join(ROOT, 'src-tauri', 'tauri.conf.json');
const DOT_TAURI = path.join(os.homedir(), '.tauri');
const KEY_PATH = path.join(DOT_TAURI, 'tizu-updater.key');
const PUB_PATH = path.join(DOT_TAURI, 'tizu-updater.key.pub');
const PW_PATH = path.join(DOT_TAURI, 'tizu-updater.password');

const password = process.argv[2] || process.env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD || 'joemark-release-key';

fs.mkdirSync(DOT_TAURI, { recursive: true });

if (!fs.existsSync(KEY_PATH) || !fs.existsSync(PUB_PATH)) {
  console.log('[setup-keys] Generating new Tauri updater signing keypair at:', KEY_PATH);
  execSync(
    `npx tauri signer generate -w ${JSON.stringify(KEY_PATH)} -p ${JSON.stringify(password)} --force`,
    { cwd: ROOT, stdio: 'inherit' }
  );
  fs.writeFileSync(PW_PATH, password + '\n', 'utf8');
  console.log('[setup-keys] Saved signing password to:', PW_PATH);
} else {
  console.log('[setup-keys] Existing signing keypair found at:', KEY_PATH);
}

const pubKey = fs.readFileSync(PUB_PATH, 'utf8').trim();
const conf = JSON.parse(fs.readFileSync(TAURI_CONF, 'utf8'));
if (!conf.plugins) conf.plugins = {};
if (!conf.plugins.updater) conf.plugins.updater = {};
conf.plugins.updater.pubkey = pubKey;
fs.writeFileSync(TAURI_CONF, JSON.stringify(conf, null, 2) + '\n', 'utf8');

console.log('[setup-keys] Updated plugins.updater.pubkey in src-tauri/tauri.conf.json!');
console.log('[setup-keys] Public key:', pubKey);
