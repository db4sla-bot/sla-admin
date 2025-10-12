#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swPath = path.join(__dirname, '../public/sw.js');
let swContent = fs.readFileSync(swPath, 'utf8');

const timestamp = Date.now();
const newVersion = `sla-admin-v${timestamp}`;

swContent = swContent.replace(
  /const CACHE_NAME = '[^']+'/,
  `const CACHE_NAME = '${newVersion}'`
);

fs.writeFileSync(swPath, swContent);

console.log(`✅ Updated PWA cache version to: ${newVersion}`);
console.log('🔄 New version will be pushed to all installed apps');
