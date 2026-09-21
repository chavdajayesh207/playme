const fs = require('fs');
const content = fs.readFileSync('src/components/MavFarmView.tsx', 'utf8');

const lines = content.split('\n');
let stack = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // ignore comments and strings for simplicity (imperfect but good enough for this)
  let cleanedLine = line.replace(/\{?\/\*.*?\*\/\}?/g, '').replace(/'.*?'/g, "''").replace(/".*?"/g, '""');
  
  const opens = cleanedLine.match(/<div(?=\s|>)[^>]*?(?<!\/)>/g) || [];
  for (const open of opens) {
      stack.push(i + 1);
  }
  
  const closes = cleanedLine.match(/<\/div>/g) || [];
  for (const close of closes) {
      if (stack.length > 0) {
          stack.pop();
      } else {
          console.log(`Unmatched </div> at line ${i + 1}`);
      }
  }
  
  if (cleanedLine.includes('</motion.div>')) {
      console.log(`</motion.div> at line ${i + 1}. Current stack depth: ${stack.length}`);
      if (stack.length > 0) {
          console.log(`Unclosed divs opened at lines: ${stack.join(', ')}`);
      }
  }
}
