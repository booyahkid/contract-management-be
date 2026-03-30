#!/usr/bin/env node

/**
 * Backend Cleanup Script
 * Removes unnecessary development, test, and temporary files
 */

const fs = require('fs');
const path = require('path');

const filesToRemove = [
  // Development/Debug files
  'debug-db.js',
  
  // Test scripts (move to archive or remove)
  'scripts/test-file-metadata.js',
  'scripts/test-file-system.js', 
  'scripts/test-rag-integration.js',
  'scripts/enhance-file-metadata.js',
  'scripts/migrate-file-metadata.js',
  
  // Documentation files (can be moved to docs folder)
  'AUTH_ACCOUNTS.md',
  'BACKEND_FIX_SUMMARY.md',
  
  // Postman collection (move to docs or tools folder)
  'contract-management.postman_collection.json',
  
  // System files
  '.DS_Store'
];

const filesToKeep = [
  // Essential scripts
  'scripts/reset-users.js',
  'scripts/sync-contracts-to-rag.js',
  'scripts/fix-contract-id-types.js'
];

function cleanupBackend() {
  console.log('🧹 Starting Backend Cleanup...\n');
  
  const baseDir = __dirname;
  let removedCount = 0;
  let skippedCount = 0;
  
  filesToRemove.forEach(relativePath => {
    const fullPath = path.join(baseDir, relativePath);
    
    if (fs.existsSync(fullPath)) {
      try {
        if (fs.statSync(fullPath).isDirectory()) {
          fs.rmSync(fullPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(fullPath);
        }
        console.log(`✅ Removed: ${relativePath}`);
        removedCount++;
      } catch (error) {
        console.log(`❌ Failed to remove: ${relativePath} - ${error.message}`);
        skippedCount++;
      }
    } else {
      console.log(`⏭️  Already missing: ${relativePath}`);
      skippedCount++;
    }
  });
  
  // Create docs folder and move documentation
  const docsDir = path.join(baseDir, 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir);
    console.log('📁 Created docs/ folder');
  }
  
  // Move any remaining documentation files
  const docFiles = ['AUTH_ACCOUNTS.md', 'BACKEND_FIX_SUMMARY.md'].filter(file => 
    fs.existsSync(path.join(baseDir, file))
  );
  
  docFiles.forEach(file => {
    const srcPath = path.join(baseDir, file);
    const destPath = path.join(docsDir, file);
    try {
      fs.renameSync(srcPath, destPath);
      console.log(`📄 Moved to docs/: ${file}`);
    } catch (error) {
      console.log(`❌ Failed to move: ${file} - ${error.message}`);
    }
  });
  
  console.log(`\n🎉 Cleanup Complete!`);
  console.log(`   Removed: ${removedCount} files`);
  console.log(`   Kept: ${filesToKeep.length} essential scripts`);
  console.log(`   Skipped: ${skippedCount} files`);
  
  console.log('\n📋 Remaining Essential Structure:');
  showDirectoryStructure(baseDir);
}

function showDirectoryStructure(dir, level = 0) {
  const indent = '  '.repeat(level);
  const items = fs.readdirSync(dir).filter(item => 
    !item.startsWith('.') && 
    item !== 'node_modules' && 
    item !== 'uploads'
  );
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const isDir = fs.statSync(fullPath).isDirectory();
    
    if (isDir) {
      console.log(`${indent}📁 ${item}/`);
      if (level < 2) { // Only go 2 levels deep
        showDirectoryStructure(fullPath, level + 1);
      }
    } else {
      console.log(`${indent}📄 ${item}`);
    }
  });
}

if (require.main === module) {
  cleanupBackend();
}

module.exports = { cleanupBackend };
