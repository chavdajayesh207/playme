const yts = require('yt-search');

const queries = [
  "Kishore Kumar R.D. Burman best hit songs",
  "Asha Bhosle Mohammed Rafi retro romance",
  "Anup Ghosal R.D. Burman memorable",
  "Kishore Kumar Kalyanji romance",
  "Asha Bhosle hit songs old",
  "Lata Mangeshkar Mohammed Rafi classic",
  "70s Bollywood Flashback hit songs",
  "80s Bollywood Flashback hit songs"
];

const titles = [
  "Anand Bakshi Signature",
  "Best of Retro Romance: Bollywood",
  "Unforgettable R. D. Burman",
  "70s Bollywood Romance",
  "Unforgettable Asha Bhosle",
  "60s Bollywood Romance",
  "70s Bollywood Flashback",
  "80s Bollywood Flashback"
];

const artists = [
  "Kishore Kumar, R. D. Burman",
  "Asha Bhosle, Mohammed Rafi",
  "Anup Ghosal, R. D. Burman",
  "Kishore Kumar, Kalyanji",
  "Asha Bhosle, Mohammed Rafi",
  "Lata Mangeshkar, Mohammed Rafi",
  "Kishore Kumar, Asha Bhosle",
  "Kishore Kumar, Asha Bhosle"
];

async function run() {
  const results = [];
  for(let i=0; i<queries.length; i++) {
    const r = await yts(queries[i]);
    const v = r.videos[0];
    if(v) {
      results.push(`  { id: 'ec-${i+1}', title: '${titles[i]}', artist: '${artists[i]}', duration: ${v.seconds}, url: '${v.url}', coverUrl: '${v.thumbnail}', genre: 'Bollywood', isYoutube: true, youtubeId: '${v.videoId}' },`);
    }
  }
  console.log("const ETERNAL_CLASSICS: RailTrack[] = [");
  console.log(results.join("\n"));
  console.log("];");
}

run();
