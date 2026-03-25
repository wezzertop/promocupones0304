import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve('./src');

const replacements = [
  { from: /1ED760/g, to: '07B5A7' },     // Neon Green -> Primary Teal
  { from: /4ADE80/g, to: '25b84e' },     // Brighter Neon -> Hover Green
  { from: /16A34A/g, to: '069c90' },     // Darker Green -> Active Dark
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
        console.log(`Reverted: ${fullPath}`);
      }
    }
  }
}

console.log('Starting theme revert...');
processDirectory(SRC_DIR);
console.log('Theme revert complete!');
