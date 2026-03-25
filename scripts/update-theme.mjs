import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve('./src');

const replacements = [
  { from: /07B5A7/g, to: '1ED760' }, // Primary Teal -> Neon Green
  { from: /25b84e/g, to: '4ADE80' }, // Hover Green -> Brighter Neon
  { from: /069c90/g, to: '16A34A' }, // Active Dark -> Darker Green
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

console.log('Starting theme replacement...');
processDirectory(SRC_DIR);
console.log('Theme replacement complete!');
