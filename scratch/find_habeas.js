import fs from 'fs';
import path from 'path';

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      searchDir(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('habeas_data')) {
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('habeas_data') || line.includes('settings')) {
            console.log(`${fullPath}:${index + 1}: ${line.trim()}`);
          }
        });
      }
    }
  });
}

searchDir('src');
