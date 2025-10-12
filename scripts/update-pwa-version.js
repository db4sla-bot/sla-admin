#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to service worker file
const swPath = path.join(__dirname, '../public/sw.js');

// Read the service worker file
let swContent = fs.readFileSync(swPath, 'utf8');

// Generate new version with timestamp
const timestamp = Date.now();
const newVersion = `sla-admin-v${timestamp}`;

// Replace cache name with new version
swContent = swContent.replace(
  /const CACHE_NAME = '[^']+'/,
  `const CACHE_NAME = '${newVersion}'`
);

// Write back to file
fs.writeFileSync(swPath, swContent);

console.log(`✅ Updated PWA cache version to: ${newVersion}`);
console.log('🔄 New version will be pushed to all installed apps');

// Also update package.json version for tracking
const packagePath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const currentVersion = packageJson.version.split('.');
currentVersion[2] = parseInt(currentVersion[2]) + 1; // Increment patch version
packageJson.version = currentVersion.join('.');
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));

console.log(`📦 Updated package.json version to: ${packageJson.version}`);