const fs = require('fs');
const code = fs.readFileSync('src/components/MavFarmView.tsx', 'utf8');

const lines = code.split('\n');

let divs = 0;
let braces = 0;

for (let i = 995; i <= 1780; i++) {
  const line = lines[i];
  
  if (!line || line.includes('//')) continue;
  
  let opens = (line.match(/<div(\s|>)/g) || []).length;
  let closes = (line.match(/<\/div>/g) || []).length;
  let selfCloses = (line.match(/<div[^>]*\/>/g) || []).length;
  opens -= selfCloses;

  let braceOpens = (line.match(/\{/g) || []).length;
  let braceCloses = (line.match(/\}/g) || []).length;
  
  // Exclude simple expressions like {lyricsOffset} or inline string tempaltes
  // This is a naive check but works for structure.
  let isJustExpr = (line.match(/\{[^\}]*\}/g) || []).length;
  braceOpens -= isJustExpr;
  braceCloses -= isJustExpr;

  divs += (opens - closes);
  braces += (braceOpens - braceCloses);
  
  if (opens !== closes || braceOpens !== braceCloses) {
    if (divs < 0 || braces < 0) {
      console.log(`Mismatch detected at line ${i+1}! divs=${divs}, braces=${braces} | ${line}`);
    }
  }
}
console.log(`Final at 1780: divs=${divs}, braces=${braces}`);
