const fs = require('fs');

async function fetchYoutubeSubtitles(youtubeId) {
  try {
    console.log(`[YT Subtitles] Fetching HTML for ${youtubeId}...`);
    const response = await fetch(`https://www.youtube.com/watch?v=${youtubeId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });
    if (!response.ok) return [];

    const html = await response.text();

    const match = html.match(/"captionTracks":\s*(\[.+?\])/);
    if (!match) {
      console.log(`[YT Subtitles] No captionTracks found for video ${youtubeId}`);
      return [];
    }

    const captionTracks = JSON.parse(match[1]);
    console.log("Found caption tracks:", captionTracks.map(t => t.languageCode + " " + t.vssId));
    if (!Array.isArray(captionTracks) || captionTracks.length === 0) return [];

    let selectedTrack = captionTracks.find(t => t.languageCode === 'en' && !t.vssId.startsWith('a.'));
    if (!selectedTrack) selectedTrack = captionTracks.find(t => t.languageCode === 'en');
    if (!selectedTrack) selectedTrack = captionTracks[0];

    console.log("Selected track:", selectedTrack.languageCode, selectedTrack.vssId);

    if (!selectedTrack || !selectedTrack.baseUrl) return [];

    const xmlRes = await fetch(selectedTrack.baseUrl + '&fmt=srv1');
    if (!xmlRes.ok) return [];
    const xmlText = await xmlRes.text();

    const lines = [];
    const textRegex = /<text start="([\d.]+)" dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
    let textMatch;

    while ((textMatch = textRegex.exec(xmlText)) !== null) {
      const start = parseFloat(textMatch[1]);
      let text = textMatch[3]
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/<\/?[^>]+(>|$)/g, "")
        .trim();

      if (text) {
        lines.push({ time: Math.round(start * 10) / 10, text });
      }
    }

    console.log(`[YT Subtitles] Successfully scraped ${lines.length} timed lines for video ${youtubeId}`);
    console.log(lines.slice(0, 5));
    return lines;
  } catch (err) {
    console.warn(`[YT Subtitles] Scrape failed for ${youtubeId}:`, err);
    return [];
  }
}

fetchYoutubeSubtitles('sFMRqxCexDk');
