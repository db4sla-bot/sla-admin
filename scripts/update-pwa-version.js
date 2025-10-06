#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Path to service worker file
const swPath = path.join(__dirname, '../public/sw.js');

// Read the service worker file
let swContent = fs.readFileSync(swPath, 'utf8');

// Extract current version number
const versionMatch = swContent.match(/const CACHE_NAME = 'sla-admin-v(\d+)'/);
if (versionMatch) {
  const currentVersion = parseInt(versionMatch[1]);
  const newVersion = currentVersion + 1;
  
  // Replace with new version
  swContent = swContent.replace(
    /const CACHE_NAME = 'sla-admin-v\d+'/,
    `const CACHE_NAME = 'sla-admin-v${newVersion}'`
  );
  
  // Write back to file
  fs.writeFileSync(swPath, swContent);
  
  console.log(`✅ Updated PWA cache version from v${currentVersion} to v${newVersion}`);
  console.log('🔄 Your changes will now be visible in the PWA after refresh');
} else {
  console.log('❌ Could not find cache version in service worker');
}