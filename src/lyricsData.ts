/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export const LYRICS_DATABASE: Record<string, LyricLine[]> = {
  'the-weeknd-blinding-lights': [
    { time: 0, text: "🎵 [Dynamic Synth-Wave Beats Playing]" },
    { time: 6, text: "Yeah..." },
    { time: 9, text: "I've been tryna call..." },
    { time: 13, text: "I've been on my own for too long..." },
    { time: 18, text: "Maybe you can show me how to love, maybe?" },
    { time: 24, text: "I'm going through withdrawals..." },
    { time: 28, text: "You don't even have to do too much..." },
    { time: 33, text: "You can turn me on with just a touch, baby" },
    { time: 38, text: "I look around and Sin City's cold and empty..." },
    { time: 43, text: "No one's around to judge me..." },
    { time: 48, text: "I can't see clearly once you're gone..." },
    { time: 52, text: "I said, ooh, I'm blinded by the lights!" },
    { time: 59, text: "No, I can't sleep until I feel your touch..." },
    { time: 65, text: "I said, ooh, I'm drowning in the night!" },
    { time: 72, text: "Oh, when I'm like this, you're the one I trust..." },
    { time: 78, text: "🎵 [Spiraling Keyboard Hook Section]" },
    { time: 88, text: "I'm running out of time..." },
    { time: 92, text: "'Cause I can see the sun light up the sky" },
    { time: 96, text: "So I hit the road in overdrive, baby, oh" },
    { time: 101, text: "The city's cold and empty..." },
    { time: 106, text: "No one's around to judge me..." },
    { time: 111, text: "I can't see clearly once you're gone..." },
    { time: 115, text: "I said, ooh, I'm blinded by the lights!" },
    { time: 122, text: "No, I can't sleep until I feel your touch..." },
    { time: 128, text: "I said, ooh, I'm drowning in the night!" },
    { time: 135, text: "Oh, when I'm like this, you're the one I trust..." },
    { time: 142, text: "🎵 [Ambient Breakdown Tempo]" },
    { time: 147, text: "I'm just walking by to let you know..." },
    { time: 151, text: "I can never say it on the phone..." },
    { time: 155, text: "Will never let you go this time..." },
    { time: 159, text: "I said, ooh, I'm blinded by the lights!" },
    { time: 166, text: "No, I can't sleep until I feel your touch..." },
    { time: 172, text: "Hey! Hey! Hey!" },
    { time: 178, text: "Ooh, blinded by the lights!" },
    { time: 184, text: "No, I can't sleep until I feel your touch..." }
  ],
  'ar-rahman-dil-se-re': [
    { time: 0, text: "🎵 [Acoustic Guitar Plucking Intro]" },
    { time: 8, text: "Dil se re..." },
    { time: 13, text: "Dil se re..." },
    { time: 18, text: "Dil to aakhir dil hai na..." },
    { time: 24, text: "Meethi meethi mushkil hai na..." },
    { time: 29, text: "Dhadkanon mein dhadkan ban kar ke" },
    { time: 35, text: "Dhadakte raho, dil se re..." },
    { time: 42, text: "🎵 [Flute Harmony & Bass Rise]" },
    { time: 55, text: "Ek dafaa tumne kahaa tha..." },
    { time: 61, text: "Tu naheen to kuch naheen..." },
    { time: 66, text: "Ek dafaa fir se kaho tum..." },
    { time: 72, text: "Humsafar, dil ke qareeb..." },
    { time: 78, text: "Dil se re..." },
    { time: 83, text: "Dil se re..." },
    { time: 89, text: "🎵 [Percussion Beat Drop Section]" },
    { time: 102, text: "Bandhanon se azaad hain dilon ki raahein" },
    { time: 109, text: "Kyoon darta hai dil sun kar sargoshiyaan?" },
    { time: 116, text: "Shaam ke saaye dhalne lage hain" },
    { time: 122, text: "Tum aa jaao ke bechain hain bahein..." },
    { time: 128, text: "Dil se re..." },
    { time: 133, text: "Dil se re..." }
  ],
  'local-train-choo-lo': [
    { time: 0, text: "🎵 [Nostalgic Indie Guitar Delay]" },
    { time: 12, text: "Khada hoon aaj bhi wahin..." },
    { time: 18, text: "Ki dil fir beqaraar hai..." },
    { time: 24, text: "Khada hoon aaj bhi wahin..." },
    { time: 30, text: "Ki tera intezaar hai..." },
    { time: 36, text: "🎵 [Melodic Bass Integration]" },
    { time: 48, text: "Choo lo jo mujhe tum kabhi..." },
    { time: 54, text: "Kho na jaaoon main raat mein..." },
    { time: 60, text: "Suno jo mere tum haseen..." },
    { time: 66, text: "Dhal na jaaoon main baat mein..." },
    { time: 72, text: "🎵 [Indie Rock Chorus Explosion]" },
    { time: 84, text: "Aise tum mile ho mujhe..." },
    { time: 90, text: "Ki jaise koi khwaab ho..." },
    { time: 96, text: "Hai pyaari ye dosti teri..." },
    { time: 102, text: "Ki jaise tum gulaab ho..." },
    { time: 108, text: "Choo lo jo mujhe tum kabhi..." },
    { time: 114, text: "Kho na jaaoon main raat mein..." }
  ],
  'prateek-kuhad-cold-mess': [
    { time: 0, text: "🎵 [Mellow Electric Keyboard Ambience]" },
    { time: 7, text: "I feel nothing at all..." },
    { time: 11, text: "When you hold my hand..." },
    { time: 15, text: "We are walking along the shore..." },
    { time: 20, text: "Writing our names in the sand..." },
    { time: 26, text: "Oh, you're a cold mess, baby..." },
    { time: 31, text: "But I'm starting to love the cold" },
    { time: 36, text: "You're a beautiful disaster..." },
    { time: 41, text: "That I want to keep and hold..." },
    { time: 47, text: "🎵 [Soft Acoustic Chord Transition]" },
    { time: 58, text: "Wish I could stay here forever..." },
    { time: 63, text: "Under the shade of your eyes..." },
    { time: 68, text: "Whispering secrets to you..." },
    { time: 73, text: "No more distance, no more lies..." },
    { time: 79, text: "I'm a mess of your grace..." },
    { time: 84, text: "You're the peace in my space..." }
  ],
  'dj-snake-let-me-love-you': [
    { time: 0, text: "🎵 [Bright EDM Synth Waves]" },
    { time: 8, text: "I used to believe..." },
    { time: 12, text: "We were burning on the edge of something beautiful" },
    { time: 18, text: "Something beautiful..." },
    { time: 22, text: "Selling a dream..." },
    { time: 25, text: "Smoke and mirrors keep us waiting on a miracle" },
    { time: 31, text: "On a miracle..." },
    { time: 35, text: "Say, go on, scream it out and write it in the sky" },
    { time: 41, text: "No, don't you let us die..." },
    { time: 46, text: "Don't you give up on me..." },
    { time: 50, text: "Don't give up, nah, nah, nah!" },
    { time: 53, text: "I won't give up on you..." },
    { time: 57, text: "Let me love you..." },
    { time: 60, text: "Let me love you..." },
    { time: 63, text: "🎵 [EDM Vocal-Chop Drop Section]" },
    { time: 78, text: "Don't you give up on me..." },
    { time: 82, text: "Don't you let us fall..." }
  ]
};

const LYRICS_GENERATION_CACHE: Record<string, LyricLine[]> = {};

export function getTrackLyrics(trackId: string, title: string, artist: string, durationSec: number): LyricLine[] {
  const cleanId = trackId || `${title || 'track'}-${artist || 'artist'}`;
  if (LYRICS_DATABASE[cleanId]) {
    return LYRICS_DATABASE[cleanId];
  }
  return [];
}

/**
 * Converts raw Genius lyrics text (newline-separated) into timed LyricLine[]
 * by evenly distributing lines across the song duration.
 * This gives pseudo-sync timing for lyrics fetched from the Genius API.
 */
export function convertGeniusTextToTimedLyrics(
  rawText: string,
  durationSec: number
): LyricLine[] {
  if (!rawText || !rawText.trim()) return [];

  const duration = (typeof durationSec === 'number' && !isNaN(durationSec) && durationSec > 0) ? durationSec : 180;

  // Split into lines, filter empty ones, clean up whitespace
  const rawLines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (rawLines.length === 0) return [];

  // Remove section markers like [Verse 1], [Chorus], [Bridge] but keep them as markers
  const lines: { text: string; isSection: boolean }[] = rawLines.map((line) => {
    const isSection = /^\[.*\]$/.test(line);
    return { text: line, isSection };
  });

  // Calculate timing: leave ~3s intro, ~3s outro, distribute rest evenly
  const introTime = 3;
  const outroBuffer = 5;
  const usableDuration = Math.max(duration - introTime - outroBuffer, lines.length * 2);
  const interval = usableDuration / lines.length;

  const timedLines: LyricLine[] = lines.map((line, idx) => ({
    time: Math.round((introTime + idx * interval) * 10) / 10,
    text: line.isSection ? `🎵 ${line.text}` : line.text,
  }));

  return timedLines;
}
