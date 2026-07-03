// ============================================================
// PlayMe Music Hub — Full Data Architecture
// Every section has proper images and YouTube queries
// ============================================================

export interface MusicHubItem {
  id: string;
  name: string;
  emoji: string;
  query: string;
  image: string;
  subtitle?: string;
  color?: string; // For gradients where applicable
}

// 🎨 Moods emojis for visual cards
export const MUSIC_MOODS: MusicHubItem[] = [
  { id: 'chill',       name: 'Chill',       emoji: '🧊', color: 'from-sky-600/80 to-cyan-500/80',       query: 'chill lofi hip hop beats',         image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80' },
  { id: 'focus',       name: 'Focus',       emoji: '🎯', color: 'from-emerald-600/80 to-teal-500/80',   query: 'deep focus study music',            image: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=600&q=80' },
  { id: 'workout',     name: 'Workout',     emoji: '🏋️', color: 'from-orange-600/80 to-red-600/80',     query: 'gym workout motivation mix',        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80' },
  { id: 'romantic',    name: 'Romantic',     emoji: '💕', color: 'from-pink-600/80 to-rose-500/80',      query: 'romantic love songs playlist',       image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&q=80' },
  { id: 'rain',        name: 'Rain',        emoji: '🌧️', color: 'from-slate-700/80 to-blue-900/80',     query: 'rain sounds relaxing music',        image: 'https://images.unsplash.com/photo-1515694346937-94d85e39e59a?w=600&q=80' },
  { id: 'sleep',       name: 'Sleep',       emoji: '🌙', color: 'from-indigo-700/80 to-purple-900/80',  query: 'deep sleep ambient music',          image: 'https://images.unsplash.com/photo-1531353826977-0941b4779a1c?w=600&q=80' },
  { id: 'party',       name: 'Party',       emoji: '🎉', color: 'from-fuchsia-600/80 to-pink-600/80',   query: 'party hits mix 2024',               image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80' },
  { id: 'night-drive', name: 'Night Drive', emoji: '🌃', color: 'from-violet-700/80 to-fuchsia-900/80', query: 'night drive synthwave retrowave',    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80' },
  { id: 'meditation',  name: 'Meditation',  emoji: '🧘', color: 'from-teal-500/80 to-emerald-700/80',   query: 'meditation healing music',          image: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=600&q=80' },
  { id: 'happy',       name: 'Happy',       emoji: '😊', color: 'from-yellow-500/80 to-orange-600/80',  query: 'happy feel good songs',             image: 'https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?w=600&q=80' },
  { id: 'sad',         name: 'Sad',         emoji: '😢', color: 'from-slate-600/80 to-gray-800/80',     query: 'sad emotional songs playlist',      image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80' },
  { id: 'festival',    name: 'Festival',    emoji: '🎪', color: 'from-purple-600/80 to-indigo-600/80',  query: 'tomorrowland edm festival mix',     image: 'https://images.unsplash.com/photo-1540039155732-61ee0172e293?w=600&q=80' },
];

// 🎼 Genres
export const MUSIC_GENRES: MusicHubItem[] = [
  { id: 'pop',       name: 'Pop',       emoji: '🎤', query: 'top pop hits 2024 playlist',       image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&q=80' },
  { id: 'hiphop',    name: 'Hip-Hop',   emoji: '🎧', query: 'rap hip hop hits playlist',        image: 'https://images.unsplash.com/photo-1546427660-eb346c344ba5?w=600&q=80' },
  { id: 'rock',      name: 'Rock',      emoji: '🎸', query: 'classic rock greatest hits',       image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=600&q=80' },
  { id: 'edm',       name: 'EDM',       emoji: '💿', query: 'edm dance hits mix',              image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80' },
  { id: 'indie',     name: 'Indie',     emoji: '🍃', query: 'indie folk acoustic playlist',     image: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=600&q=80' },
  { id: 'jazz',      name: 'Jazz',      emoji: '🎷', query: 'smooth jazz saxophone playlist',   image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&q=80' },
  { id: 'blues',     name: 'Blues',     emoji: '🎵', query: 'classic blues guitar playlist',    image: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=600&q=80' },
  { id: 'country',   name: 'Country',   emoji: '🤠', query: 'country hits playlist',            image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&q=80' },
  { id: 'classical', name: 'Classical', emoji: '🎻', query: 'classical orchestra piano',        image: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=600&q=80' },
  { id: 'folk',      name: 'Folk',      emoji: '🪕', query: 'folk music acoustic playlist',     image: 'https://images.unsplash.com/photo-1485579149621-3123dd979885?w=600&q=80' },
  { id: 'bollywood', name: 'Bollywood', emoji: '🇮🇳', query: 'bollywood latest hits 2024',       image: 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=600&q=80' },
  { id: 'kpop',      name: 'K-Pop',     emoji: '🇰🇷', query: 'kpop top hits playlist',           image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80' },
  { id: 'punjabi',   name: 'Punjabi',   emoji: '🎶', query: 'punjabi hits latest songs',        image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80' },
  { id: 'tamil',     name: 'Tamil',     emoji: '🎬', query: 'tamil latest songs playlist',      image: 'https://images.unsplash.com/photo-1590766940554-634a7ed41450?w=600&q=80' },
  { id: 'telugu',    name: 'Telugu',    emoji: '🎞️', query: 'telugu latest songs playlist',     image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80' },
  { id: 'malayalam', name: 'Malayalam', emoji: '🌴', query: 'malayalam songs hits playlist',    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80' },
  { id: 'gujarati',  name: 'Gujarati',  emoji: '🪘', query: 'gujarati garba songs playlist',   image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80' },
];

// 🏆 Charts
export const MUSIC_CHARTS: MusicHubItem[] = [
  { id: 'global',   name: 'Global Top 100',   emoji: '🌐', query: 'global top 100 songs playlist',         image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&q=80' },
  { id: 'india',    name: 'India Top 100',     emoji: '🇮🇳', query: 'india top 100 songs playlist',          image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&q=80' },
  { id: 'usa',      name: 'USA Top 100',       emoji: '🇺🇸', query: 'usa billboard hot 100 playlist',        image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&q=80' },
  { id: 'uk',       name: 'UK Top 100',        emoji: '🇬🇧', query: 'uk top 100 songs official chart',       image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80' },
  { id: 'korea',    name: 'Korea Top 100',     emoji: '🇰🇷', query: 'melon top 100 kpop chart',              image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80' },
  { id: 'japan',    name: 'Japan Top 100',     emoji: '🇯🇵', query: 'japan billboard hot 100 jpop',          image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80' },
  { id: 'trending', name: 'Trending This Week', emoji: '📈', query: 'trending music this week playlist',    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80' },
];

// 🔥 Trending
export const MUSIC_TRENDING: MusicHubItem[] = [
  { id: 'top-songs',   name: 'Top Songs',       emoji: '🎵', query: 'top hits today 2024 playlist',          image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80' },
  { id: 'top-artists', name: 'Top Artists',      emoji: '🎤', query: 'top artists songs playlist 2024',      image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80' },
  { id: 'viral',       name: 'Viral Tracks',     emoji: '🦠', query: 'viral hits tiktok songs trending',     image: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=600&q=80' },
  { id: 'albums',      name: 'Trending Albums',  emoji: '💿', query: 'trending albums full album',           image: 'https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=600&q=80' },
  { id: 'videos',      name: 'Trending Videos',  emoji: '🎬', query: 'trending music videos official 2024',  image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&q=80' },
];

// 🆕 New Releases
export const NEW_RELEASES: MusicHubItem[] = [
  { id: 'nr1', name: 'Latest Bollywood',   emoji: '🎬', query: 'new bollywood songs 2024',        image: 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=600&q=80' },
  { id: 'nr2', name: 'New Pop Releases',   emoji: '🎤', query: 'new pop songs releases 2024',     image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80' },
  { id: 'nr3', name: 'Fresh Hip-Hop',      emoji: '🔥', query: 'new hip hop releases 2024',       image: 'https://images.unsplash.com/photo-1546427660-eb346c344ba5?w=600&q=80' },
  { id: 'nr4', name: 'New K-Pop',          emoji: '🇰🇷', query: 'new kpop songs 2024 releases',    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80' },
  { id: 'nr5', name: 'New EDM Drops',      emoji: '💫', query: 'new edm releases 2024',           image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80' },
  { id: 'nr6', name: 'Fresh Indie',        emoji: '🍃', query: 'new indie music releases 2024',   image: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=600&q=80' },
];

// 👨‍🎤 Legendary Artists
export const ARTIST_CATEGORIES: MusicHubItem[] = [
  { id: 'michael',   name: 'Michael Jackson',   emoji: '👑', query: 'Michael Jackson greatest hits', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg/330px-Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg', subtitle: 'King of Pop' },
  { id: 'theweeknd', name: 'The Weeknd',        emoji: '🌙', query: 'The Weeknd top hits',        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/The_Weeknd_Portrait_by_Brian_Ziff.jpg/330px-The_Weeknd_Portrait_by_Brian_Ziff.jpg', subtitle: 'R&B / Pop' },
  { id: 'taylor',    name: 'Taylor Swift',      emoji: '🌟', query: 'Taylor Swift best songs',    image: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png', subtitle: 'Pop' },
  { id: 'edsheeran', name: 'Ed Sheeran',        emoji: '🎸', query: 'Ed Sheeran acoustic hits',   image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Ed_Sheeran-6886_%28cropped%29.jpg/330px-Ed_Sheeran-6886_%28cropped%29.jpg', subtitle: 'Pop / Acoustic' },
  { id: 'arijit',    name: 'Arijit Singh',      emoji: '🎤', query: 'Arijit Singh latest songs',  image: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Arijit_Singh_performance_at_Chandigarh_2025.jpg', subtitle: 'Bollywood' },
];

// 🎙 Live Sessions
export const LIVE_SESSIONS: MusicHubItem[] = [
  { id: 'concerts',  name: 'Live Concerts',    emoji: '🎪', query: 'live concert full performance',   image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80' },
  { id: 'acoustic',  name: 'Acoustic Sessions',emoji: '🎸', query: 'acoustic live session music',     image: 'https://images.unsplash.com/photo-1485579149621-3123dd979885?w=600&q=80' },
  { id: 'tinydesk',  name: 'Tiny Desk',        emoji: '🖥️', query: 'NPR tiny desk concert',           image: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=600&q=80' },
  { id: 'mtv',       name: 'MTV Unplugged',    emoji: '📺', query: 'MTV unplugged full performance',  image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&q=80' },
  { id: 'live',      name: 'Live Shows',       emoji: '🎤', query: 'live music show performance',     image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80' },
];

// 📻 Radio
export const RADIO_CATEGORIES: MusicHubItem[] = [
  { id: 'artist', name: 'Artist Radio',  emoji: '🎤', query: 'artist radio mix nonstop',        image: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600&q=80' },
  { id: 'genre',  name: 'Genre Radio',   emoji: '🎵', query: 'genre radio nonstop music',       image: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=600&q=80' },
  { id: 'mood',   name: 'Mood Radio',    emoji: '🌈', query: 'mood based music radio',          image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80' },
  { id: 'ai',     name: 'AI Radio',      emoji: '🤖', query: 'AI curated music playlist mix',   image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80' },
];

// 🌍 Around the World
export const WORLD_REGIONS: MusicHubItem[] = [
  { id: 'india',  name: 'India',   emoji: '🇮🇳', query: 'indian music top hits',     image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&q=80' },
  { id: 'usa',    name: 'USA',     emoji: '🇺🇸', query: 'american music top hits',   image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&q=80' },
  { id: 'uk',     name: 'UK',      emoji: '🇬🇧', query: 'british music top hits',    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80' },
  { id: 'japan',  name: 'Japan',   emoji: '🇯🇵', query: 'japanese music jpop anime',  image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80' },
  { id: 'korea',  name: 'Korea',   emoji: '🇰🇷', query: 'korean music kpop hits',    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80' },
  { id: 'brazil', name: 'Brazil',  emoji: '🇧🇷', query: 'brazilian music funk samba', image: 'https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?w=600&q=80' },
  { id: 'spain',  name: 'Spain',   emoji: '🇪🇸', query: 'spanish music reggaeton',   image: 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=600&q=80' },
  { id: 'france', name: 'France',  emoji: '🇫🇷', query: 'french music hits playlist', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80' },
];

// ❤️ Made For You
export const MADE_FOR_YOU_MOCK: MusicHubItem[] = [
  { id: 'mix1', name: 'My Supermix',         emoji: '🎧', color: 'from-violet-600/80 to-purple-800/80', query: 'supermix best of all genres',     subtitle: 'Your favorite artists & discovery', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80' },
  { id: 'mix2', name: 'Discover Weekly',     emoji: '📻', color: 'from-emerald-600/80 to-cyan-700/80', query: 'discover new music weekly',       subtitle: 'New music based on your taste', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80' },
  { id: 'mix3', name: 'On Repeat',           emoji: '🔁', color: 'from-pink-600/80 to-rose-700/80',    query: 'songs on repeat popular',         subtitle: 'Songs you love right now', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80' },
  { id: 'mix4', name: 'Chill Mix',           emoji: '🧊', color: 'from-sky-600/80 to-blue-800/80',     query: 'chill vibes relaxing music',      subtitle: 'Kick back and relax', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80' },
  { id: 'mix5', name: 'New Release Radar',   emoji: '📡', color: 'from-orange-600/80 to-amber-700/80', query: 'new release radar latest',        subtitle: 'Catch up on the latest', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80' },
  { id: 'mix6', name: 'Time Capsule',        emoji: '⏳', color: 'from-amber-600/80 to-yellow-800/80', query: 'throwback hits nostalgia',        subtitle: 'A trip back through your history', image: 'https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=600&q=80' },
];

// 📝 Editor's Picks
export const EDITORS_PICKS: MusicHubItem[] = [
  { id: 'ep1', name: 'Songs of the Year',   emoji: '🏆', query: 'best songs of the year playlist',  image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80' },
  { id: 'ep2', name: 'Hidden Gems',         emoji: '💎', query: 'hidden gem songs underrated',      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80' },
  { id: 'ep3', name: 'Acoustic Favorites',  emoji: '🎸', query: 'acoustic favorites playlist',      image: 'https://images.unsplash.com/photo-1485579149621-3123dd979885?w=600&q=80' },
  { id: 'ep4', name: 'Late Night Vibes',    emoji: '🌙', query: 'late night vibes music playlist',  image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80' },
];

// 🏷️ Top Labels
export const TOP_LABELS: MusicHubItem[] = [
  { id: 'umg',       name: 'Universal Music', emoji: '💿', query: 'Universal Music Group latest', image: 'https://www.google.com/s2/favicons?domain=universalmusic.com&sz=128' },
  { id: 'sony',      name: 'Sony Music',      emoji: '💿', query: 'Sony Music Entertainment latest', image: 'https://www.google.com/s2/favicons?domain=sonymusic.com&sz=128' },
  { id: 'warner',    name: 'Warner Music',    emoji: '💿', query: 'Warner Music Group latest', image: 'https://www.google.com/s2/favicons?domain=wmg.com&sz=128' },
  { id: 'tseries',   name: 'T-Series',        emoji: '💿', query: 'T-Series latest music', image: 'https://www.google.com/s2/favicons?domain=tseries.com&sz=128' },
  { id: 'saregama',  name: 'Saregama',        emoji: '💿', query: 'Saregama Music latest', image: 'https://www.google.com/s2/favicons?domain=saregama.com&sz=128' },
  { id: 'tips',      name: 'Tips',            emoji: '💿', query: 'Tips Official latest music', image: 'https://www.google.com/s2/favicons?domain=tips.in&sz=128' },
  { id: 'republic',  name: 'Republic',        emoji: '💿', query: 'Republic Records latest', image: 'https://www.google.com/s2/favicons?domain=republicrecords.com&sz=128' },
  { id: 'interscope',name: 'Interscope',      emoji: '💿', query: 'Interscope Records latest', image: 'https://www.google.com/s2/favicons?domain=interscope.com&sz=128' },
  { id: 'defjam',    name: 'Def Jam',         emoji: '💿', query: 'Def Jam Recordings latest', image: 'https://www.google.com/s2/favicons?domain=defjam.com&sz=128' },
  { id: 'atlantic',  name: 'Atlantic',        emoji: '💿', query: 'Atlantic Records latest music', image: 'https://www.google.com/s2/favicons?domain=atlanticrecords.com&sz=128' },
];
