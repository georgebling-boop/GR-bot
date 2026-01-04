#!/usr/bin/env node
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Generate build info for deployment verification
 */
function generateBuildInfo() {
  let gitSha = 'unknown';
  let gitBranch = 'unknown';
  
  try {
    gitSha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    console.warn('Warning: Could not get git SHA:', error.message);
  }
  
  try {
    gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    console.warn('Warning: Could not get git branch:', error.message);
  }

  const buildInfo = {
    gitSha,
    gitBranch,
    buildTime: new Date().toISOString(),
    buildTimestamp: Date.now(),
  };

  const outputPath = resolve(__dirname, '..', 'client', 'public', 'build-info.json');
  writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2));
  
  console.log('✓ Build info generated:', buildInfo);
  return buildInfo;
}

generateBuildInfo();
