(global as any).localStorage = { getItem: () => null };
import dotenv from 'dotenv';
dotenv.config();

const labels = [
  'Universal Music Group', 'Sony Music India', 'Warner Music Group',
  'T-Series', 'Saregama Music', 'Tips Official', 'Republic Records',
  'Interscope Records', 'Def Jam Recordings', 'Atlantic Records'
];

async function run() {
  for (const label of labels) {
    try {
      const response = await fetch(`http://localhost:3001/api/youtube/channel-info?channelName=${encodeURIComponent(label)}`);
      const info = await response.json();
      console.log(`[${label}] -> ${info?.snippet?.thumbnails?.high?.url || 'NOT_FOUND'}`);
    } catch (err: any) {
      console.log(`[${label}] Error: ${err.message}`);
    }
  }
}
run();
