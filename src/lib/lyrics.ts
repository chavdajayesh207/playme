/**
 * LRCLIB Synced Lyrics Service
 * Primary: LRCLIB (free synced lyrics)
 * Fallback: Genius API (plain text)
 * Fallback 2: Local lyricsData.ts
 */

export interface SyncedLyricLine {
  time: number; // in seconds
  text: string;
}

/**
 * Parse LRC format string into timed lyric lines.
 * LRC format: [mm:ss.xx] lyric text
 */
export function parseLRC(lrc: string): SyncedLyricLine[] {
  if (!lrc || !lrc.trim()) return [];

  const lines = lrc.split('\n');
  const result: SyncedLyricLine[] = [];
  let offsetMs = 0; // standard global offset in milliseconds

  for (const line of lines) {
    // Parse standard offset metadata tag, e.g. [offset:+500] or [offset:-300]
    const offsetMatch = line.match(/^\[offset:\s*([+-]?\d+)\]/i);
    if (offsetMatch) {
      offsetMs = parseInt(offsetMatch[1], 10);
      continue;
    }

    // Match [mm:ss.xx] or [mm:ss] format
    const match = line.match(/^\[(\d{1,2}):(\d{2})\.?(\d{0,3})?\]\s*(.*)/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const centiseconds = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) / 1000 : 0;
      // Convert offset in milliseconds to seconds and add it to timeline
      const time = minutes * 60 + seconds + centiseconds + (offsetMs / 1000);
      const text = match[4].trim();

      // Skip empty lines and metadata tags
      if (text && !text.startsWith('[')) {
        result.push({ time, text });
      }
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

/**
 * Distribute plain text lyrics evenly across song duration.
 * Used when only unsynced/plain lyrics are available.
 */
export function distributeUnsynced(plainText: string, totalDuration: number): SyncedLyricLine[] {
  if (!plainText || !plainText.trim()) return [];

  const lines = plainText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) return [];

  // Start lyrics at 5% of song, end at 95%
  const startOffset = totalDuration * 0.05;
  const endOffset = totalDuration * 0.95;
  const interval = (endOffset - startOffset) / Math.max(lines.length - 1, 1);

  return lines.map((text, idx) => ({
    time: startOffset + idx * interval,
    text,
  }));
}

export interface LyricsResult {
  lines: SyncedLyricLine[];
  source: 'lrclib-synced' | 'lrclib-plain' | 'genius' | 'local' | 'none' | 'youtube-cc';
  isSynced: boolean;
}

/**
 * Fetch synced lyrics from the server endpoint.
 * Server handles YT Subtitles -> LRCLIB -> Genius fallback chain.
 */
export async function fetchSyncedLyrics(
  title: string,
  artist: string,
  duration: number,
  youtubeId?: string
): Promise<LyricsResult> {
  try {
    // Priority 1: Fetch live synced lyrics from server (YouTube CC -> LRCLIB -> Genius waterfall)
    // Live synced lyrics are already perfectly aligned to the specific YouTube video length!
    const res = await fetch(
      `/api/lyrics/synced?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}&duration=${Math.round(duration)}${youtubeId ? `&youtubeId=${encodeURIComponent(youtubeId)}` : ''}`
    );

    if (res.ok) {
      const data = await res.json();

      // Case AA: YouTube Subtitles (perfect native CC sync)
      if (data.ytSubtitles && Array.isArray(data.ytSubtitles) && data.ytSubtitles.length > 0) {
        return { lines: data.ytSubtitles, source: 'youtube-cc', isSynced: true };
      }

      // Case A: LRCLIB synced lyrics (real timestamps matched to video duration)
      if (data.syncedLyrics && data.syncedLyrics.trim()) {
        const parsed = parseLRC(data.syncedLyrics);
        if (parsed.length > 0) {
          return { lines: parsed, source: 'lrclib-synced', isSynced: true };
        }
      }

      // Case B: LRCLIB plain lyrics (distributed timing)
      if (data.plainLyrics && data.plainLyrics.trim()) {
        const distributed = distributeUnsynced(data.plainLyrics, duration || 180);
        if (distributed.length > 0) {
          return { lines: distributed, source: 'lrclib-plain', isSynced: false };
        }
      }

      // Case C: Genius lyrics from server (distributed timing fallback)
      if (data.geniusLyrics && data.geniusLyrics.trim()) {
        const distributed = distributeUnsynced(data.geniusLyrics, duration || 180);
        if (distributed.length > 0) {
          return { lines: distributed, source: 'genius', isSynced: false };
        }
      }
    }
  } catch (err) {
    console.warn('[Lyrics] Live fetch failed, resorting to local assets:', err);
  }

  // Priority 2: Offline local database fallback (when offline or no online matches exist)
  try {
    const localDb = await import('../lyricsData').catch(() => null);
    if (localDb && localDb.LYRICS_DATABASE) {
      const lowercaseTitle = title.toLowerCase();
      
      // Look for explicit key match or fuzzy match
      let matchedKey = Object.keys(localDb.LYRICS_DATABASE).find(key => {
        if (key.includes(lowercaseTitle.replace(/\s+/g, '-'))) return true;
        return false;
      });

      if (matchedKey) {
        const localLines = localDb.LYRICS_DATABASE[matchedKey];
        if (localLines && localLines.length > 0) {
          // Auto-align local database lyrics using our smart duration auto-calibration!
          const finalLocalTime = localLines[localLines.length - 1].time;
          let autoOffset = 0;

          if (duration > 10 && finalLocalTime > 10) {
            const diff = duration - finalLocalTime;
            // If the YouTube stream is longer than the local template, auto-calculate
            // typical intro silent padding to realign the rhythm and flow!
            if (diff > 2 && diff < 40) {
              autoOffset = diff * 0.45; // 45% of trailing difference goes to intro offset calibration
              console.log(`[Auto-Calibrator] Auto-aligned flow for "${title}". Added +${autoOffset.toFixed(1)}s rhythm compensation.`);
            }
          }

          return {
            lines: localLines.map(l => ({ time: l.time + autoOffset, text: l.text })),
            source: 'local',
            isSynced: true
          };
        }
      }
    }
  } catch (localErr) {
    console.warn('[Lyrics] Local asset lookup error:', localErr);
  }

  // Priority 3: No lyrics available (Return empty array so the UI knows nothing is available)
  return {
    lines: [],
    source: 'none',
    isSynced: false
  };
}

export function getActiveLyricIndex(
  lines: SyncedLyricLine[],
  currentTime: number
): number {
  if (lines.length === 0) return -1;
  if (currentTime < lines[0].time) return -1;

  // Binary search for efficiency with large lyrics
  let lo = 0;
  let hi = lines.length - 1;
  let result = -1;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (lines[mid].time <= currentTime) {
      result = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return result;
}
