import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve('./src');

const replacements = [
  { from: /text-\[#161616\]/g, to: 'text-black' },
  { from: /border-\[#161616\]/g, to: 'border-background' },
  { from: /border-\[#222222\]/g, to: 'border-surface' },
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      replacements.forEach(({ from, to }) => {
        if (from.test(content)) {
          content = content.replace(from, to);
          changed = true;
        }
      });

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

console.log('Starting theme replacement Phase 2...');
processDirectory(SRC_DIR);
console.log('Theme replacement Phase 2 complete!');
