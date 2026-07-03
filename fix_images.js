const fs = require('fs');
let file = fs.readFileSync('src/lib/musicHubData.ts', 'utf8');

const replacements = {
  '1571266028243-d220c6cd1277': '1514525253161-7a46d19cd819', // EDM -> Party
  '1485579149621-3123dd979885': '1460723237483-7a6dc9d0b212', // Indie -> Folk
  '1627907228175-2bf83c316271': '1598387993441-a364f854c3e1', // Bollywood -> Latest Bollywood
  '1621440290800-0c699ed3feea': '1493976040374-85c8e12f0c0e', // K-Pop -> Japan
  '1605806616949-1e87b487cb2a': '1514525253161-7a46d19cd819', // Punjabi -> Party
  '1583226270004-984e72390a88': '1504898770365-14faca6a7320', // Tamil -> Malayalam
  '1599818815858-a5fcc13bb22f': '1504898770365-14faca6a7320', // Telugu -> Malayalam
  '1558618666-fcd25c85f82e': '1524492412937-b28074a5d7da', // Gujarati -> India
  '1485738422979-f5c462d49f04': '1501386761578-eac5c94b800a', // USA -> Pop
  '1583425423320-e13b7ebf234a': '1493976040374-85c8e12f0c0e', // Korea -> Japan
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/The_Weeknd_Cannes_2023.png/800px-The_Weeknd_Cannes_2023.png': 'https://images.unsplash.com/photo-1549813292-1fb3907c13cb?w=600&q=80',
  'https://upload.wikimedia.org/wikipedia/commons/3/30/Arijit_Singh_Performing_At_MTV_India_Music_Summit.jpg': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80'
};

for (const [oldUrl, newUrl] of Object.entries(replacements)) {
  file = file.split(oldUrl).join(newUrl);
}

fs.writeFileSync('src/lib/musicHubData.ts', file);
console.log('Fixed images');
