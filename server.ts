/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { serverDb } from "./server-db";
import { SERVER_STATIC_TRACKS, ServerTrack } from "./static-tracks";
import crypto from "crypto";
import ytdl from "@distube/ytdl-core";
import { spawn } from "child_process";
import ytSearch from "yt-search";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { userDb } from "./server-user-db";
import cron from 'node-cron';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(express.json({ limit: "60mb" }));
app.use(express.urlencoded({ limit: "60mb", extended: true }));

// Secure Credentials Fallbacks
const YOUTUBE_API_KEY = process.env.VITE_YOUTUBE_API_KEY || "AIzaSyC1DL-jzZ9cRrjG05sRGkDheyN7WJ2t9hE";
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || "3365e090ac4f43d992307bd575fdec10";
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || "3483a096c7514515b13545fb085e2c23";
const LASTFM_API_KEY = process.env.LASTFM_API_KEY || "b7edee38e3e46776a17ea82139b99a7f";
const GENIUS_ACCESS_TOKEN = process.env.GENIUS_ACCESS_TOKEN || "roU98UZAi4LbsHn94IpsyqZbdFWmGjC5HrBYyySuT_gTWOf3eG7FROysQyfVFSyY";

// Set up server-side Gemini client as per guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// ==========================================
// 1. YouTube backend search helpers
// ==========================================
async function backendSearchYoutube(query: string, maxResults: number = 1): Promise<any[]> {
  const cacheKey = `yt_search_${query.toLowerCase()}_${maxResults}`;
  const cached = serverDb.getCache(cacheKey);
  if (cached) {
    console.log(`[Cache Hit] YouTube search cache found for: "${query}"`);
    return cached;
  }

  const dateStr = new Date().toISOString().split("T")[0];
  const count = serverDb.getSearchCount(dateStr);
  const staticSongs = typeof SERVER_STATIC_TRACKS !== "undefined" ? SERVER_STATIC_TRACKS : [];

  // Limit removed based on user request

  try {
    serverDb.incrementSearchCount(dateStr);
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${maxResults}&q=${encodeURIComponent(
      query
    )}&type=video&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const isQuotaExceeded = JSON.stringify(errBody).toLowerCase().includes("quotaexceeded") || res.status === 403;
      if (isQuotaExceeded) {
        console.warn(`[Quota Exceeded] YouTube API key quota exceeded. Satisfying backend search "${query}" from cache.`);
        return serverDb.searchCachedAndStaticTracks(query, staticSongs).slice(0, maxResults);
      }
      return [];
    }
    
    const data = await res.json();
    const results = (data.items || []).map((item: any) => ({
      id: `yt-${item.id.videoId}`,
      title: item.snippet.title
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim(),
      artist: (item.snippet.channelTitle || "").replace(/\s+-\s+topic$/i, "").replace(/\s+vevo$/i, "").trim(),
      album: "AI Music Stream",
      duration: 210, // approximate default
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      coverUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || "",
      genre: "AI recommendation",
      isYoutube: true,
      youtubeId: item.id.videoId,
    }));

    if (results.length > 0) {
      serverDb.setCache(cacheKey, results);
    } else {
      return serverDb.searchCachedAndStaticTracks(query, staticSongs).slice(0, maxResults);
    }
    return results;
  } catch (e) {
    console.error("Backend YT search error, utilizing cache matching fallback:", e);
    return serverDb.searchCachedAndStaticTracks(query, staticSongs).slice(0, maxResults);
  }
}

// ==========================================
// 2. Spotify Client Credentials Flow
// ==========================================
let spotifyAccessToken = "";
let spotifyTokenExpiry = 0;

async function getSpotifyToken(): Promise<string> {
  if (spotifyAccessToken && Date.now() < spotifyTokenExpiry) {
    return spotifyAccessToken;
  }
  try {
    const creds = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64");
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${creds}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    if (!res.ok) {
      console.error("Spotify Token Request Failed:", res.statusText);
      return "";
    }
    const data = await res.json();
    spotifyAccessToken = data.access_token;
    spotifyTokenExpiry = Date.now() + data.expires_in * 1000 - 60000;
    return spotifyAccessToken;
  } catch (e) {
    console.error("Error fetching Spotify token:", e);
    return "";
  }
}

// ==========================================
// 3. Genius Lyrics Scraping Helper
// ==========================================
async function scrapeGeniusLyrics(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
      },
    });
    if (!res.ok) return "Failed to load Genius lyrics page.";
    const html = await res.text();

    const lyricsBlocks: string[] = [];
    const regex = /<div[^>]*data-lyrics-container="true"[^>]*>([\s\S]*?)<\/div>/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      lyricsBlocks.push(match[1]);
    }

    if (lyricsBlocks.length === 0) {
      const oldRegex = /<div class="lyrics">([\s\S]*?)<\/div>/;
      const oldMatch = html.match(oldRegex);
      if (oldMatch) {
        lyricsBlocks.push(oldMatch[1]);
      }
    }

    if (lyricsBlocks.length === 0) {
      return "[Lyrics not formatted for automatic extraction - please visit full song link]";
    }

    let cleanLyrics = lyricsBlocks.join("\n");
    cleanLyrics = cleanLyrics.replace(/<br\s*\/?>/gi, "\n");
    cleanLyrics = cleanLyrics.replace(/<[^>]+>/g, "");
    // Decode all HTML entities
    cleanLyrics = cleanLyrics
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, "/")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(parseInt(code, 10)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => String.fromCharCode(parseInt(hex, 16)));

    // Strip Genius page metadata that leaks into scraped lyrics
    // (e.g. "262 ContributorsTranslationsTürkçeSvenskaEspañol...")
    cleanLyrics = cleanLyrics
      .split("\n")
      .filter((line) => {
        const l = line.trim();
        // Remove lines that are purely numbers (contributor counts)
        if (/^\d+$/.test(l)) return false;
        // Remove lines with Genius metadata patterns
        if (/Contributors\s*Translations/i.test(l)) return false;
        if (/Türkçe|Svenska|Español|Slovenčina|Português|Polski|Norsk|日本語|עברית|Italiano|Deutsch|Français|فارسی|Nederlands|Dansk|Shqip|العربية/i.test(l) && l.length > 60) return false;
        // Remove embed/share lines
        if (/^Embed$/i.test(l) || /^Share$/i.test(l) || /^URLCopied$/i.test(l)) return false;
        return true;
      })
      .join("\n");

    return cleanLyrics.trim();
  } catch (e) {
    console.error("Error scraping lyrics:", e);
    return "Error parsing lyrics from Genius.";
  }
}

// ==========================================
// API Endpoint handlers
// ==========================================

// Spotify recommendations lookup
app.get("/api/spotify/recommendations", async (req, res) => {
  const { title, artist } = req.query;
  if (!title || !artist) {
    return res.status(400).json({ error: "Missing title or artist parameter" });
  }

  const cacheKey = `spotify_recs_${String(title).toLowerCase()}_${String(artist).toLowerCase()}`;
  const cached = serverDb.getCache(cacheKey);
  if (cached) {
    console.log(`[Cache Hit] Spotify recommendations for keys: ${cacheKey}`);
    return res.json({ tracks: cached });
  }

  const token = await getSpotifyToken();
  if (!token) {
    return res.status(500).json({ error: "Could not authenticate with Spotify" });
  }

  try {
    // 1. Search Track to get Seed IDs
    const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
      `track:${title} artist:${artist}`
    )}&type=track&limit=1`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!searchRes.ok) {
      return res.status(500).json({ error: "Spotify track search failed" });
    }

    const searchData = await searchRes.json();
    const trackItem = searchData.tracks?.items?.[0];

    if (!trackItem) {
      return res.json({ tracks: [], message: "No seed track matching this metadata was found on Spotify" });
    }

    const trackId = trackItem.id;
    const artistId = trackItem.artists?.[0]?.id;

    // 2. Query recommendations using the seeds
    const recsUrl = `https://api.spotify.com/v1/recommendations?limit=6&seed_tracks=${trackId}&seed_artists=${artistId}`;
    const recsRes = await fetch(recsUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!recsRes.ok) {
      return res.status(500).json({ error: "Spotify recommendations failed" });
    }

    const recsData = await recsRes.json();
    const formatted = (recsData.tracks || []).map((t: any) => ({
      title: t.name,
      artist: t.artists?.map((a: any) => a.name).join(", "),
      album: t.album?.name,
      coverUrl: t.album?.images?.[0]?.url || t.album?.images?.[1]?.url || "",
      duration: Math.round(t.duration_ms / 1000),
    }));

    serverDb.setCache(cacheKey, formatted);
    return res.json({ tracks: formatted });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || "Spotify request error" });
  }
});

// Last.fm statistics lookup
app.get("/api/lastfm", async (req, res) => {
  const { title, artist } = req.query;
  if (!title || !artist) {
    return res.status(400).json({ error: "Missing title or artist query" });
  }

  const cacheKey = `lastfm_${String(title).toLowerCase()}_${String(artist).toLowerCase()}`;
  const cached = serverDb.getCache(cacheKey);
  if (cached) {
    console.log(`[Cache Hit] Last.fm stats for keys: ${cacheKey}`);
    return res.json(cached);
  }

  try {
    const url = `http://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${LASTFM_API_KEY}&artist=${encodeURIComponent(
      artist as string
    )}&track=${encodeURIComponent(title as string)}&format=json`;
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(500).json({ error: "Last.fm API query failed" });
    }

    const data = await response.json();
    const track = data.track;
    if (!track) {
      const emptyResult = { statsNotFound: true };
      serverDb.setCache(cacheKey, emptyResult);
      return res.json(emptyResult);
    }

    const stats = {
      listeners: track.listeners || "0",
      playcount: track.playcount || "0",
      tags: (track.toptags?.tag || []).slice(0, 5).map((t: any) => t.name),
      album: track.album?.title || "",
      summary: track.wiki?.summary || "",
    };

    serverDb.setCache(cacheKey, stats);
    return res.json(stats);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ==========================================
// Persistent Global Audio Database & Real-time Playback API Helpers
// ==========================================

// ==========================================
// YouTube API Proxy, Rate Limiter, and 7-Day Resiliency Layer
// ==========================================

function serverParseISO8601Duration(durationStr: string): number {
  const matches = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!matches) {
    return 210; // default 3.5 minutes fallback
  }
  const hours = parseInt(matches[1] || "0", 10);
  const minutes = parseInt(matches[2] || "0", 10);
  const seconds = parseInt(matches[3] || "0", 10);
  return (hours * 3600) + (minutes * 60) + seconds;
}

function serverCleanTitle(title: string): string {
  return title
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\[\s*(?:Official\s+)?(?:Music\s+)?(?:Video|Audio|Lyrics)\s*\]/gi, "")
    .replace(/\(\s*(?:Official\s+)?(?:Music\s+)?(?:Video|Audio|Lyrics)\s*\)/gi, "")
    .replace(/\(\s*Lyrics\s*\)/gi, "")
    .trim();
}

function serverCleanArtistName(name: string): string {
  return name
    .replace(/\s+-\s+topic$/i, "")
    .replace(/\s+vevo$/i, "")
    .trim();
}

app.get("/api/download", async (req, res) => {
  const { id, format, title } = req.query;
  if (!id) {
    return res.status(400).send("Missing video ID");
  }

  const videoId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
  const fileFormat = format === 'mp4' ? 'mp4' : 'mp3';
  const fileTitle = typeof title === 'string' && title.trim() ? title : 'download';

  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getInfo(url);
    
    // Choose appropriate format
    let ytdlFormat;
    if (fileFormat === 'mp4') {
      ytdlFormat = ytdl.chooseFormat(info.formats, { quality: 'highestvideo', filter: 'videoandaudio' });
    } else {
      ytdlFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });
    }

    if (!ytdlFormat) {
      return res.status(404).send("Requested format not available");
    }

    const filename = `${fileTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${fileFormat}`;
    
    res.header('Content-Disposition', `attachment; filename="${filename}"`);
    res.header('Content-Type', fileFormat === 'mp4' ? 'video/mp4' : 'audio/mpeg');

    ytdl(url, { format: ytdlFormat })
      .pipe(res)
      .on('error', (err) => {
        console.error('Download stream error:', err);
        if (!res.headersSent) {
          res.status(500).send("Error streaming download");
        }
      });
  } catch (error) {
    console.error('Error in /api/download:', error);
    res.status(500).send("Failed to initiate download");
  }
});

// 1. GET /api/youtube/search -> Proxies YouTube queries securely with high-resiliency fallbacks
app.get("/api/youtube/search", async (req, res) => {
  const query = (req.query.q || "") as string;
  const maxResults = parseInt((req.query.maxResults || "15") as string, 10);
  const clientKey = req.headers["x-youtube-api-key"] as string;
  const videoDuration = req.query.videoDuration as string;
  const channelId = req.query.channelId as string;

  if (!query && !channelId) {
    return res.status(400).json({ error: "Missing search parameter 'q' or 'channelId'" });
  }

  const cacheKey = `yt_search_${query.toLowerCase()}_${channelId || ""}_${maxResults}_${videoDuration || "any"}`;
  const cached = serverDb.getCache(cacheKey);
  if (cached) {
    console.log(`[Cache Hit] Proxy YouTube search cache found for: "${query}" (duration=${videoDuration || "any"})`);
    return res.json(cached);
  }

  const dateStr = new Date().toISOString().split("T")[0];
  // Search limit removed based on user request

  const apiKey = clientKey || YOUTUBE_API_KEY;

  try {
    if (!clientKey) {
      serverDb.incrementSearchCount(dateStr);
    }

    let searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${maxResults}&type=video&key=${apiKey}`;
    if (channelId) {
      searchUrl += `&channelId=${channelId}&order=date`;
    }
    if (query) {
      searchUrl += `&q=${encodeURIComponent(query)}`;
    }

    if (videoDuration && ["long", "medium", "short"].includes(videoDuration)) {
      searchUrl += `&videoDuration=${videoDuration}`;
    }

    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      const errData = await searchResponse.json().catch(() => ({}));
      console.warn(`[YouTube Search Fetch Failure] status=${searchResponse.status}. Activating yt-search scraper fallback for query: "${query}"`, errData);
      
      try {
        const fallbackSearch = await ytSearch(query || "Podcast");
        const fallbackResults = fallbackSearch.videos.slice(0, maxResults).map((item: any) => ({
          id: `yt-${item.videoId}`,
          title: serverCleanTitle(item.title),
          artist: serverCleanArtistName(item.author?.name || "YouTube"),
          album: "Podcast Video",
          duration: item.duration?.seconds || 210,
          url: item.url,
          coverUrl: item.thumbnail || item.image || "",
          genre: "Podcast",
          description: item.description || "",
          isYoutube: true,
          youtubeId: item.videoId,
        }));
        
        serverDb.setCache(cacheKey, fallbackResults);
        return res.json(fallbackResults);
      } catch (scrapingErr) {
        console.error("yt-search fallback also failed:", scrapingErr);
        let fallbackResults = serverDb.searchCachedAndStaticTracks(query, SERVER_STATIC_TRACKS || []);
        if (videoDuration === "long") {
          fallbackResults = fallbackResults.filter((t: any) => t.duration >= 600);
        }
        return res.json(fallbackResults);
      }
    }

    const data = await searchResponse.json();
    const searchItems = data.items || [];

    if (searchItems.length === 0) {
      return res.json([]);
    }

    // Capture durations using video details lookup
    const videoIds = searchItems.map((item: any) => item.id.videoId).join(",");
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${apiKey}`;

    let durationsMap: Record<string, number> = {};
    try {
      const videoDetailsResponse = await fetch(videosUrl);
      if (videoDetailsResponse.ok) {
        const detailsData = await videoDetailsResponse.json();
        (detailsData.items || []).forEach((item: any) => {
          const durationSec = serverParseISO8601Duration(item.contentDetails?.duration || "");
          durationsMap[item.id] = durationSec;
        });
      }
    } catch (err) {
      console.warn("Failed parsing YouTube details on proxy server:", err);
    }

    let results = searchItems.map((item: any) => {
      const videoId = item.id.videoId;
      const title = item.snippet.title;
      const artist = item.snippet.channelTitle || "YouTube Stream";
      const coverUrl = item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || "";
      const description = item.snippet.description || "";
      const durSec = durationsMap[videoId] || 210;

      return {
        id: `yt-${videoId}`,
        title: serverCleanTitle(title),
        artist: serverCleanArtistName(artist),
        album: "YouTube Stream",
        duration: durSec,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        coverUrl,
        genre: "Cloud Stage",
        description,
        isYoutube: true,
        youtubeId: videoId,
      };
    });

    if (videoDuration === "long") {
      results = results.filter((t: any) => t.duration >= 600);
    }

    serverDb.setCache(cacheKey, results);
    return res.json(results);
  } catch (error: any) {
    console.error(`[Proxy Error] YouTube search live fetch failed, fallback to Cache:`, error);
    let fallbackResults = serverDb.searchCachedAndStaticTracks(query, SERVER_STATIC_TRACKS || []);
    if (videoDuration === "long") {
      fallbackResults = fallbackResults.filter((t: any) => t.duration >= 600);
    }
    return res.json(fallbackResults);
  }
});

// 2. GET /api/youtube/live-events -> Clean proxy for concert and broadcast lookups
app.get("/api/youtube/live-events", async (req, res) => {
  const query = (req.query.q || "") as string;
  const filterType = (req.query.filterType || "all") as "all" | "live" | "concert" | "festival" | "acoustic";
  const clientKey = req.headers["x-youtube-api-key"] as string;

  if (!query) {
    return res.status(400).json({ error: "Missing search query parameter 'q'" });
  }

  const cacheKey = `yt_live_${query.toLowerCase()}_${filterType}`;
  const cached = serverDb.getCache(cacheKey);
  if (cached) {
    console.log(`[Cache Hit] Clean proxy live events cache found for: "${query}" (${filterType})`);
    return res.json(cached);
  }

  const dateStr = new Date().toISOString().split("T")[0];
  // Live events search limit removed based on user request

  const apiKey = clientKey || YOUTUBE_API_KEY;

  let eventQuerySuffix = " live music performance concert";
  if (filterType === "live") {
    eventQuerySuffix = " live stream music concert broadcast";
  } else if (filterType === "festival") {
    eventQuerySuffix = " full live set festival show";
  } else if (filterType === "acoustic") {
    eventQuerySuffix = " acoustic live session unplugged";
  } else if (filterType === "concert") {
    eventQuerySuffix = " live in concert full show";
  }

  const finalQuery = `${query}${eventQuerySuffix}`.trim();

  try {
    if (!clientKey) {
      serverDb.incrementSearchCount(dateStr);
    }

    let searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=18&q=${encodeURIComponent(
      finalQuery
    )}&type=video&key=${apiKey}`;

    if (filterType === "live") {
      searchUrl += `&eventType=live`;
    }

    const response = await fetch(searchUrl);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.warn(`[YouTube Live Events Fetch Failure] status=${response.status}. Fulfilling via high-resiliency cache and static catalog for query: "${query}"`, errData);
      const fallbackResults = serverDb.searchCachedAndStaticTracks(query, SERVER_STATIC_TRACKS || []);
      // Ensure results returned adhere to YouTube format for the Live component
      const processedFallback = fallbackResults.map(t => ({
        ...t,
        isYoutube: true,
        youtubeId: t.youtubeId || (t.url ? t.url.split('v=')[1] : null) || '3_g2un5M350', // provide valid fallback ID if none exists
        album: t.album && t.album.includes("Live") ? t.album : "💿 Recorded Live Set",
        genre: t.genre && t.genre.includes("Live") ? t.genre : "Concert Set"
      }));
      return res.json(processedFallback);
    }

    const data = await response.json();
    const searchItems = data.items || [];

    if (searchItems.length === 0) {
      return res.json([]);
    }

    const videoIds = searchItems.map((item: any) => item.id.videoId).join(",");
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${apiKey}`;

    let durationsMap: Record<string, number> = {};
    let livesStateMap: Record<string, boolean> = {};

    try {
      const videoDetailsResponse = await fetch(videosUrl);
      if (videoDetailsResponse.ok) {
        const detailsData = await videoDetailsResponse.json();
        (detailsData.items || []).forEach((item: any) => {
          const isLive = item.snippet?.liveBroadcastContent === "live";
          livesStateMap[item.id] = isLive;
          const durationSec = isLive ? 0 : serverParseISO8601Duration(item.contentDetails?.duration || "");
          durationsMap[item.id] = durationSec;
        });
      }
    } catch (err) {
      console.warn("Failed parsing live video details on proxy server:", err);
    }

    const results = searchItems.map((item: any) => {
      const videoId = item.id.videoId;
      const title = item.snippet.title;
      const artist = item.snippet.channelTitle || "Live Streamer";
      const coverUrl = item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || "";
      const description = item.snippet.description || "";
      const isLiveActive = livesStateMap[videoId] || filterType === "live";
      const durSec = isLiveActive ? 0 : (durationsMap[videoId] || 3600);

      return {
        id: `yt-${videoId}`,
        title: serverCleanTitle(title),
        artist: serverCleanArtistName(artist),
        album: isLiveActive ? "🔴 Real-time Live Event" : "💿 Recorded Live Set",
        duration: durSec,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        coverUrl,
        genre: isLiveActive ? "Live Broadcast" : "Concert Set",
        description,
        isYoutube: true,
        youtubeId: videoId,
      };
    });

    serverDb.setCache(cacheKey, results);
    return res.json(results);
  } catch (error: any) {
    console.error(`[Proxy Error] YouTube live query failed, fallback to Cache:`, error);
    const fallbackResults = serverDb.searchCachedAndStaticTracks(query, SERVER_STATIC_TRACKS || []);
    return res.json(fallbackResults);
  }
});

// 3. GET /api/youtube/channel-info -> Fetch channel details for Podcasts
app.get("/api/youtube/channel-info", async (req, res) => {
  const channelId = req.query.channelId as string;
  const channelName = req.query.channelName as string;
  const clientKey = req.headers["x-youtube-api-key"] as string;

  if (!channelId && !channelName) {
    return res.status(400).json({ error: "Missing channelId or channelName parameter" });
  }

  const cacheKey = `yt_channel_${channelId || channelName}`;
  const cached = serverDb.getCache(cacheKey);
  if (cached) {
    console.log(`[Cache Hit] Proxy YouTube channel cache found for: "${channelId || channelName}"`);
    return res.json(cached);
  }

  const apiKey = clientKey || YOUTUBE_API_KEY;

  try {
    let targetChannelId = channelId;

    if (!targetChannelId && channelName) {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(channelName)}&type=channel&maxResults=1&key=${apiKey}`;
      const searchRes = await fetch(searchUrl);
      if (!searchRes.ok) throw new Error(`YouTube API Search returned status ${searchRes.status}`);
      const searchData = await searchRes.json();
      if (!searchData.items || searchData.items.length === 0) {
        return res.status(404).json({ error: "Channel not found by name" });
      }
      targetChannelId = searchData.items[0].id.channelId;
    }

    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${targetChannelId}&key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`YouTube API returned status ${response.status}`);
    }

    const data = await response.json();
    const item = data.items?.[0];
    if (!item) {
      return res.status(404).json({ error: "Channel not found" });
    }

    const channelInfo = {
      id: item.id,
      title: item.snippet?.title || "Unknown Channel",
      description: item.snippet?.description || "",
      thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "",
      subscriberCount: item.statistics?.subscriberCount || "0",
      videoCount: item.statistics?.videoCount || "0"
    };

    serverDb.setCache(cacheKey, channelInfo);
    return res.json(channelInfo);
  } catch (error: any) {
    console.error(`[Proxy Error] YouTube channel live fetch failed:`, error);
    return res.status(500).json({ error: "Failed to fetch channel details" });
  }
});

// 4. GET /api/youtube/channel-avatar -> Redirect to channel avatar image
app.get("/api/youtube/channel-avatar", async (req, res) => {
  const channelName = (req.query.channelName || req.query.handle) as string;
  if (!channelName) {
    return res.status(400).send("Missing channelName");
  }

  const cacheKey = `yt_channel_${channelName}`;
  const cached = serverDb.getCache(cacheKey);
  if (cached && cached.thumbnail) {
    return res.redirect(cached.thumbnail);
  }

  try {
    const apiKey = YOUTUBE_API_KEY;
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(channelName)}&type=channel&maxResults=1&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) throw new Error(`Search failed`);
    const searchData = await searchRes.json();
    if (!searchData.items || searchData.items.length === 0) {
      return res.redirect(`https://api.dicebear.com/9.x/micah/svg?seed=${encodeURIComponent(channelName)}&backgroundColor=transparent&baseColor=f9a8d4,fcd34d,86efac,93c5fd&mouth=smile,laughing`);
    }
    
    const targetChannelId = searchData.items[0].id.channelId;
    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${targetChannelId}&key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Channel fetch failed`);
    
    const data = await response.json();
    const item = data.items?.[0];
    const thumbnail = item?.snippet?.thumbnails?.high?.url || item?.snippet?.thumbnails?.medium?.url || item?.snippet?.thumbnails?.default?.url;
    
    if (thumbnail) {
      serverDb.setCache(cacheKey, { thumbnail, title: item?.snippet?.title });
      return res.redirect(thumbnail);
    } else {
      return res.redirect(`https://api.dicebear.com/9.x/micah/svg?seed=${encodeURIComponent(channelName)}&backgroundColor=transparent&baseColor=f9a8d4,fcd34d,86efac,93c5fd&mouth=smile,laughing`);
    }
  } catch (err) {
    console.error("Avatar fetch failed for", channelName, err);
    return res.redirect(`https://api.dicebear.com/9.x/micah/svg?seed=${encodeURIComponent(channelName)}&backgroundColor=transparent&baseColor=f9a8d4,fcd34d,86efac,93c5fd&mouth=smile,laughing`);
  }
});

// ==========================================
// HOME DASHBOARD — Live YouTube Data with 6-Hour Cron
// ==========================================

interface HomeCategory {
  title: string;
  emoji: string;
  tracks: any[];
}

interface HomeData {
  trending: HomeCategory;
  popularPlaylists: HomeCategory;
  topCharts: HomeCategory;
  recentlyReleased: HomeCategory;
  recommended: HomeCategory;
  livePerformances: HomeCategory;
  updatedAt: string;
}

const HOME_CATEGORIES: { key: string; title: string; emoji: string; query: string }[] = [
  { key: 'trending', title: 'Trending Now', emoji: '🔥', query: '' }, // special: uses chart=mostPopular
  { key: 'popularPlaylists', title: 'Popular Playlists', emoji: '🎵', query: 'Best Music Playlists 2025' },
  { key: 'topCharts', title: 'Top Charts', emoji: '📈', query: 'Top Hits Music 2025' },
  { key: 'recentlyReleased', title: 'Recently Released', emoji: '🎧', query: 'New Music Releases This Week' },
  { key: 'recommended', title: 'Recommended For You', emoji: '⭐', query: 'Best Songs All Time Music Mix' },
  { key: 'livePerformances', title: 'Live Performances', emoji: '🎤', query: 'Best Live Music Performance Concert' },
];

async function fetchTrendingVideos(): Promise<any[]> {
  try {
    const url = `https://youtube.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=US&videoCategoryId=10&maxResults=25&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn('[Home Updater] Trending fetch failed:', res.status);
      return [];
    }
    const data = await res.json();
    return (data.items || []).map((item: any) => {
      const durSec = serverParseISO8601Duration(item.contentDetails?.duration || '');
      return {
        id: `yt-${item.id}`,
        title: serverCleanTitle(item.snippet?.title || ''),
        artist: serverCleanArtistName(item.snippet?.channelTitle || 'Unknown'),
        album: 'Trending',
        duration: durSec,
        url: `https://www.youtube.com/watch?v=${item.id}`,
        coverUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || '',
        genre: 'Trending',
        description: item.snippet?.description || '',
        isYoutube: true,
        youtubeId: item.id,
        views: item.statistics?.viewCount || '0',
        likes: item.statistics?.likeCount || '0',
        publishedAt: item.snippet?.publishedAt || '',
        channelTitle: item.snippet?.channelTitle || '',
      };
    });
  } catch (e) {
    console.error('[Home Updater] Error fetching trending:', e);
    return [];
  }
}

async function fetchCategoryVideos(query: string, maxResults: number = 15): Promise<any[]> {
  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${maxResults}&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&key=${YOUTUBE_API_KEY}`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) {
      console.warn(`[Home Updater] Category search failed for "${query}":`, searchRes.status);
      return [];
    }
    const searchData = await searchRes.json();
    const items = searchData.items || [];
    if (items.length === 0) return [];

    // Get video details for duration and stats
    const videoIds = items.map((item: any) => item.id.videoId).join(',');
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
    
    let statsMap: Record<string, any> = {};
    try {
      const detailsRes = await fetch(detailsUrl);
      if (detailsRes.ok) {
        const detailsData = await detailsRes.json();
        (detailsData.items || []).forEach((item: any) => {
          statsMap[item.id] = {
            duration: serverParseISO8601Duration(item.contentDetails?.duration || ''),
            views: item.statistics?.viewCount || '0',
            likes: item.statistics?.likeCount || '0',
          };
        });
      }
    } catch (e) {
      console.warn('[Home Updater] Stats fetch failed, continuing without stats');
    }

    return items.map((item: any) => {
      const videoId = item.id.videoId;
      const stats = statsMap[videoId] || {};
      return {
        id: `yt-${videoId}`,
        title: serverCleanTitle(item.snippet?.title || ''),
        artist: serverCleanArtistName(item.snippet?.channelTitle || 'Unknown'),
        album: 'YouTube Music',
        duration: stats.duration || 210,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        coverUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || '',
        genre: 'Music',
        description: item.snippet?.description || '',
        isYoutube: true,
        youtubeId: videoId,
        views: stats.views || '0',
        likes: stats.likes || '0',
        publishedAt: item.snippet?.publishedAt || '',
        channelTitle: item.snippet?.channelTitle || '',
      };
    });
  } catch (e) {
    console.error(`[Home Updater] Error fetching category "${query}":`, e);
    return [];
  }
}

async function updateHomeData() {
  console.log('[Home Updater] 🔄 Starting scheduled home data update...');
  const startTime = Date.now();

  try {
    // 1. Fetch Trending (uses special Videos API with chart=mostPopular)
    const trending = await fetchTrendingVideos();
    console.log(`[Home Updater] ✅ Trending: ${trending.length} tracks`);

    // 2. Fetch other categories in sequence to avoid rate limiting
    const results: Record<string, any[]> = { trending };
    
    for (const cat of HOME_CATEGORIES) {
      if (cat.key === 'trending') continue; // already fetched
      const tracks = await fetchCategoryVideos(cat.query);
      results[cat.key] = tracks;
      console.log(`[Home Updater] ✅ ${cat.title}: ${tracks.length} tracks`);
      // Small delay between requests to be kind to API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const homeData: HomeData = {
      trending: { title: 'Trending Now', emoji: '🔥', tracks: results.trending || [] },
      popularPlaylists: { title: 'Popular Playlists', emoji: '🎵', tracks: results.popularPlaylists || [] },
      topCharts: { title: 'Top Charts', emoji: '📈', tracks: results.topCharts || [] },
      recentlyReleased: { title: 'Recently Released', emoji: '🎧', tracks: results.recentlyReleased || [] },
      recommended: { title: 'Recommended For You', emoji: '⭐', tracks: results.recommended || [] },
      livePerformances: { title: 'Live Performances', emoji: '🎤', tracks: results.livePerformances || [] },
      updatedAt: new Date().toISOString(),
    };

    serverDb.setHomeCache(homeData);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Home Updater] 🎉 Home data updated successfully in ${elapsed}s`);
  } catch (e) {
    console.error('[Home Updater] ❌ Failed to update home data:', e);
  }
}

// Schedule: run every 6 hours
cron.schedule('0 */6 * * *', () => {
  console.log('[Cron] ⏰ Scheduled home data update triggered');
  updateHomeData();
});

// Also run on server startup if cache is empty or older than 6 hours
(async () => {
  const existingCache = serverDb.getHomeCache();
  if (!existingCache || !existingCache.updatedAt) {
    console.log('[Home Updater] No existing cache found, fetching initial data...');
    await updateHomeData();
  } else {
    const cacheAge = Date.now() - new Date(existingCache.updatedAt).getTime();
    const SIX_HOURS = 6 * 60 * 60 * 1000;
    if (cacheAge > SIX_HOURS) {
      console.log('[Home Updater] Cache is stale (>6 hours), refreshing...');
      await updateHomeData();
    } else {
      console.log(`[Home Updater] Cache is fresh (${(cacheAge / 60000).toFixed(0)} minutes old), skipping initial fetch.`);
    }
  }
})();

// GET /api/home — Serve cached home dashboard data
app.get('/api/home', (req, res) => {
  const homeData = serverDb.getHomeCache();
  if (!homeData) {
    return res.json({
      trending: { title: 'Trending Now', emoji: '🔥', tracks: [] },
      popularPlaylists: { title: 'Popular Playlists', emoji: '🎵', tracks: [] },
      topCharts: { title: 'Top Charts', emoji: '📈', tracks: [] },
      recentlyReleased: { title: 'Recently Released', emoji: '🎧', tracks: [] },
      recommended: { title: 'Recommended For You', emoji: '⭐', tracks: [] },
      livePerformances: { title: 'Live Performances', emoji: '🎤', tracks: [] },
      updatedAt: null,
      message: 'Home data is being loaded for the first time. Refresh in a moment.',
    });
  }
  return res.json(homeData);
});

// POST /api/home/refresh — Force refresh home data (admin use)
app.post('/api/home/refresh', async (req, res) => {
  await updateHomeData();
  return res.json({ success: true, message: 'Home data refreshed', updatedAt: new Date().toISOString() });
});

// ==========================================
// 1. GET /api/songs -> Return combined live data through API
app.get("/api/songs", (req, res) => {
  const { category, genre } = req.query;
  const customTracks = serverDb.getTracksArray();
  const allTracks = [...SERVER_STATIC_TRACKS, ...customTracks];

  const targetFilter = (category || genre) as string;
  if (targetFilter) {
    const filterLower = targetFilter.toLowerCase();
    const filtered = allTracks.filter(t => 
      t.genre.toLowerCase().includes(filterLower) || 
      (t.description && t.description.toLowerCase().includes(filterLower))
    );
    return res.json({ tracks: filtered });
  }

  return res.json({ tracks: allTracks });
});

// 2. GET /api/songs/categories -> Real-time organization of all catalogs
app.get("/api/songs/categories", (req, res) => {
  const customTracks = serverDb.getTracksArray();
  const allTracks = [...SERVER_STATIC_TRACKS, ...customTracks];

  const groupings: Record<string, ServerTrack[]> = {};
  allTracks.forEach(t => {
    const primaryGenre = t.genre.split(/[/-]/)[0].trim();
    if (!groupings[primaryGenre]) {
      groupings[primaryGenre] = [];
    }
    groupings[primaryGenre].push(t);
  });

  return res.json({ categories: groupings });
});

// 3. POST /api/songs/upload -> Save audio files securely in local serverDb
app.post("/api/songs/upload", (req, res) => {
  const {
    id,
    title,
    artist,
    album,
    genre,
    duration,
    description,
    audioBase64,
    audioMimeType,
    coverBase64,
    coverMimeType,
    coverUrl,
    isYoutube,
    youtubeId,
  } = req.body;

  if (!id || !title || !artist) {
    return res.status(400).json({ error: "Missing required track elements: id, title, artist" });
  }

  const playUrl = audioBase64 ? `/api/songs/audio/${id}` : (isYoutube ? `https://www.youtube.com/watch?v=${youtubeId}` : "/api/songs/audio/default");
  const playCoverUrl = coverBase64 ? `/api/songs/cover/${id}` : (coverUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500");

  const newTrack: ServerTrack = {
    id,
    title,
    artist,
    album: album || "Server Upload Sets",
    duration: Number(duration) || 180,
    url: playUrl,
    coverUrl: playCoverUrl,
    genre: genre || "My Mix",
    description: description || "In-memory streamed audio master.",
    isYoutube: !!isYoutube,
    youtubeId: youtubeId || "",
    createdAt: Date.now(), // timestamp set so it evicts in 7 days
  };

  let audioBuffer: Buffer | undefined;
  let coverBuffer: Buffer | undefined;

  if (audioBase64) {
    try {
      audioBuffer = Buffer.from(audioBase64, "base64");
      console.log(`[Audio Storage] Saving audio data for '${title}' (${audioBuffer.length} bytes).`);
    } catch (e: any) {
      console.error(`Error parsing audio buffer for ${title}:`, e);
    }
  }

  if (coverBase64) {
    try {
      coverBuffer = Buffer.from(coverBase64, "base64");
      console.log(`[Cover Storage] Saving cover artwork for '${title}' (${coverBuffer.length} bytes).`);
    } catch (e: any) {
      console.error(`Error parsing cover artwork buffer for ${title}:`, e);
    }
  }

  serverDb.saveTrack(newTrack, audioBuffer, audioMimeType, coverBuffer, coverMimeType);
  return res.json({ success: true, message: "Music ingested successfully and cached secure in local DB", track: newTrack });
});

// 4. GET /api/songs/audio/:id -> Dynamic stream playback from local serverDb
app.get("/api/songs/audio/:id", (req, res) => {
  const { id } = req.params;
  const audioFile = serverDb.getAudioFile(id);

  if (!audioFile) {
    return res.redirect("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3");
  }

  res.writeHead(200, {
    "Content-Type": audioFile.mimeType,
    "Content-Length": audioFile.buffer.length,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=86400",
  });
  return res.end(audioFile.buffer);
});

// 5. GET /api/songs/cover/:id -> Stream artist artwork direct from local serverDb
app.get("/api/songs/cover/:id", (req, res) => {
  const { id } = req.params;
  const coverFile = serverDb.getCoverFile(id);

  if (!coverFile) {
    return res.redirect("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500");
  }

  res.writeHead(200, {
    "Content-Type": coverFile.mimeType,
    "Content-Length": coverFile.buffer.length,
    "Cache-Control": "public, max-age=86400",
  });
  return res.end(coverFile.buffer);
});

// Genius lyrics lookup and webscraper extraction
app.get("/api/genius/lyrics", async (req, res) => {
  const { title, artist } = req.query;
  if (!title || !artist) {
    return res.status(400).json({ error: "Missing title or artist" });
  }

  const cacheKey = `lyrics_${String(title).toLowerCase()}_${String(artist).toLowerCase()}`;
  const cached = serverDb.getCache(cacheKey);
  if (cached) {
    console.log(`[Cache Hit] Genius lyrics for keys: ${cacheKey}`);
    return res.json(cached);
  }

  try {
    const q = `${artist} ${title}`;
    const geniusSearchUrl = `https://api.genius.com/search?q=${encodeURIComponent(q)}`;
    const geniusSearchRes = await fetch(geniusSearchUrl, {
      headers: { Authorization: `Bearer ${GENIUS_ACCESS_TOKEN}` },
    });

    if (!geniusSearchRes.ok) {
      return res.status(500).json({ error: "Genius lyrics search failed" });
    }

    const searchData = await geniusSearchRes.json();
    const hit = searchData.response?.hits?.[0];

    if (!hit) {
      const emptyLyrics = { lyrics: "", message: "Lyrics not found for this search" };
      serverDb.setCache(cacheKey, emptyLyrics);
      return res.json(emptyLyrics);
    }

    const songUrl = hit.result.url;
    const lyrics = await scrapeGeniusLyrics(songUrl);

    const result = {
      lyrics,
      songUrl,
      id: hit.result.id,
      headerImage: hit.result.header_image_url || "",
    };

    serverDb.setCache(cacheKey, result);
    return res.json(result);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ==========================================
// 3b. YouTube Subtitles Helper & LRCLIB Synced Lyrics Endpoint
// ==========================================

/**
 * Scrape timed subtitles from YouTube video watch page and XML endpoints
 */
async function fetchYoutubeSubtitles(youtubeId: string): Promise<Array<{ time: number; text: string }>> {
  if (!youtubeId || typeof youtubeId !== 'string') return [];
  try {
    const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(youtubeId)}`;
    const response = await fetch(watchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
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
    if (!Array.isArray(captionTracks) || captionTracks.length === 0) return [];

    // Prioritize English or manual tracks over auto-generated ones
    let selectedTrack = captionTracks.find(t => t.languageCode === 'en' && !t.vssId.startsWith('a.'));
    if (!selectedTrack) selectedTrack = captionTracks.find(t => t.languageCode === 'en');
    
    // If no English track at all, fallback to ANY manual track, else ANY auto track
    if (!selectedTrack) selectedTrack = captionTracks.find(t => !t.vssId.startsWith('a.'));
    if (!selectedTrack) selectedTrack = captionTracks[0];

    if (!selectedTrack || !selectedTrack.baseUrl) return [];

    let fetchUrl = selectedTrack.baseUrl + '&fmt=srv1';
    
    // If the track is not English, ask YouTube to auto-translate it to English
    if (selectedTrack.languageCode !== 'en') {
      fetchUrl += '&tlang=en';
    }

    const xmlRes = await fetch(fetchUrl);
    if (!xmlRes.ok) return [];
    const xmlText = await xmlRes.text();

    const lines: Array<{ time: number; text: string }> = [];
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
    return lines;
  } catch (err) {
    console.warn(`[YT Subtitles] Scrape failed for ${youtubeId}:`, err);
    return [];
  }
}

app.get("/api/lyrics/synced", async (req, res) => {
  const { title, artist, duration, youtubeId } = req.query;
  if (!title || !artist) {
    return res.status(400).json({ error: "Missing title or artist" });
  }

  const dur = parseInt(String(duration || "0"), 10);
  const cacheKey = youtubeId 
    ? `synced_lyrics_yt_${String(youtubeId)}` 
    : `synced_lyrics_${String(title).toLowerCase()}_${String(artist).toLowerCase()}_${dur}`;
  
  const cached = serverDb.getCache(cacheKey);
  if (cached) {
    console.log(`[Cache Hit] Synced lyrics for: "${title}" by "${artist}" (YT: ${youtubeId || 'none'})`);
    return res.json(cached);
  }

  let ytSubtitles: any[] = [];
  let syncedLyrics = "";
  let plainLyrics = "";
  let geniusLyrics = "";
  let source = "none";

  // Step 0: Try native YouTube closed captions first if youtubeId is provided!
  if (youtubeId && typeof youtubeId === 'string' && youtubeId.trim().length > 0) {
    try {
      ytSubtitles = await fetchYoutubeSubtitles(youtubeId);
      if (ytSubtitles.length > 0) {
        source = "youtube-cc";
        const result = { ytSubtitles, syncedLyrics, plainLyrics, geniusLyrics, source };
        serverDb.setCache(cacheKey, result);
        return res.json(result);
      }
    } catch (ytErr) {
      console.warn("[YT Subtitles] Failed to scrape subtitles, falling back to LRCLIB:", ytErr);
    }
  }

  // Step 1: Try LRCLIB (free synced lyrics database)
  try {
    const lrcUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(
      String(title)
    )}&artist_name=${encodeURIComponent(String(artist))}${dur > 0 ? `&duration=${dur}` : ""}`;

    const lrcRes = await fetch(lrcUrl, {
      headers: {
        "User-Agent": "PlayMe Music App v1.0 (https://github.com/playme)",
      },
    });

    if (lrcRes.ok) {
      const lrcData = await lrcRes.json();
      if (lrcData.syncedLyrics && lrcData.syncedLyrics.trim()) {
        syncedLyrics = lrcData.syncedLyrics;
        source = "lrclib-synced";
        console.log(`[LRCLIB] Synced lyrics found for: "${title}" by "${artist}"`);
      }
      if (lrcData.plainLyrics && lrcData.plainLyrics.trim()) {
        plainLyrics = lrcData.plainLyrics;
        if (!syncedLyrics) source = "lrclib-plain";
      }
    }
  } catch (err) {
    console.warn("[LRCLIB] Fetch failed:", err);
  }

  // Step 2: If LRCLIB has no synced, try searching LRCLIB by query
  if (!syncedLyrics) {
    try {
      const searchUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(
        String(title)
      )}&artist_name=${encodeURIComponent(String(artist))}`;

      const searchRes = await fetch(searchUrl, {
        headers: {
          "User-Agent": "PlayMe Music App v1.0 (https://github.com/playme)",
        },
      });

      if (searchRes.ok) {
        const results = await searchRes.json();
        if (Array.isArray(results) && results.length > 0) {
          // Find best match with synced lyrics
          const syncedMatch = results.find((r: any) => r.syncedLyrics && r.syncedLyrics.trim());
          if (syncedMatch) {
            syncedLyrics = syncedMatch.syncedLyrics;
            source = "lrclib-synced";
            if (!plainLyrics && syncedMatch.plainLyrics) plainLyrics = syncedMatch.plainLyrics;
            console.log(`[LRCLIB Search] Synced lyrics found for: "${title}" by "${artist}"`);
          } else if (!plainLyrics && results[0].plainLyrics) {
            plainLyrics = results[0].plainLyrics;
            source = "lrclib-plain";
          }
        }
      }
    } catch (err) {
      console.warn("[LRCLIB Search] Failed:", err);
    }
  }

  // Step 3: Genius fallback if LRCLIB has nothing
  if (!syncedLyrics && !plainLyrics) {
    try {
      const q = `${artist} ${title}`;
      const geniusSearchUrl = `https://api.genius.com/search?q=${encodeURIComponent(q)}`;
      const geniusSearchRes = await fetch(geniusSearchUrl, {
        headers: { Authorization: `Bearer ${GENIUS_ACCESS_TOKEN}` },
      });

      if (geniusSearchRes.ok) {
        const searchData = await geniusSearchRes.json();
        const hit = searchData.response?.hits?.[0];
        if (hit) {
          geniusLyrics = await scrapeGeniusLyrics(hit.result.url);
          source = "genius";
          console.log(`[Genius Fallback] Lyrics scraped for: "${title}" by "${artist}"`);
        }
      }
    } catch (err) {
      console.warn("[Genius Fallback] Failed:", err);
    }
  }

  const result = { syncedLyrics, plainLyrics, geniusLyrics, source };
  serverDb.setCache(cacheKey, result);
  return res.json(result);
});

// ==========================================
// 4. Gemini AI Endpoints & Fallback Layer
// ==========================================
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

// Multi-model resilience retry utility - switched to local Ollama for free, unlimited recommendations
async function generateContentWithRetry(params: {
  contents: any;
  config?: any;
}): Promise<any> {
  const isJson = params.config?.responseMimeType === "application/json";
  
  let prompt = params.contents;
  if (isJson) {
    prompt += "\n\nCRITICAL: Return ONLY valid JSON. Do NOT wrap your response in markdown code blocks like ```json. Your response must be parseable by JSON.parse().";
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`[AI Routing] Dispatching Ollama request (Attempt ${attempt})...`);
      const body: any = {
        model: "llama3.2:3b", // Fast, local model available on your machine
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7
        }
      };

      if (isJson) {
         body.format = "json"; // Force JSON output in Ollama
      }

      const res = await fetch("http://127.0.0.1:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Ollama API error: ${res.status} ${errText}`);
      }

      const data = await res.json();
      let text = data.response;
      
      // Cleanup markdown if the model hallucinated it despite instructions
      if (isJson) {
        text = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      }

      return { text };
    } catch (err: any) {
      console.log(`[AI Routing] Ollama request failed (${err.message}). Retrying...`);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error("Failed to generate content after retries using Ollama API");
}

// YouTube Downloader API route
app.get("/api/youtube/download", async (req, res) => {
  const { youtubeId, format } = req.query;
  if (!youtubeId || typeof youtubeId !== "string") {
    return res.status(400).json({ error: "Missing youtubeId parameter" });
  }
  const isVideo = format === "mp4";
  const videoUrl = `https://www.youtube.com/watch?v=${youtubeId}`;

  try {
    console.log(`[YouTube Downloader] Starting stream fetch for ID: ${youtubeId} (${format})`);

    // Resolve yt-dlp path from youtube-dl-exec
    const ytDlpPath = path.resolve("./node_modules/youtube-dl-exec/bin/yt-dlp");

    // Set headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Disposition", `attachment; filename="${youtubeId}.${isVideo ? "mp4" : "mp3"}"`);
    res.setHeader("Content-Type", isVideo ? "video/mp4" : "audio/mpeg");

    // Determine format string for yt-dlp
    const formatArg = isVideo ? "best[ext=mp4]/best" : "bestaudio";

    const args = [
      videoUrl,
      "--output", "-",
      "--format", formatArg,
      "--no-check-certificates",
      "--no-warnings"
    ];

    console.log(`[YouTube Downloader] Spawning yt-dlp: ${ytDlpPath} ${args.join(" ")}`);
    const child = spawn(ytDlpPath, args);

    child.stdout.pipe(res);

    child.stderr.on("data", (data) => {
      console.log(`[YouTube Downloader stderr] ${data.toString().trim()}`);
    });

    child.on("close", (code) => {
      console.log(`[YouTube Downloader] yt-dlp process exited with code ${code}`);
      if (code !== 0 && !res.headersSent) {
        res.status(500).json({ error: `yt-dlp exited with error code ${code}` });
      }
    });

    child.on("error", (err) => {
      console.error(`[YouTube Downloader] spawn error:`, err);
      if (!res.headersSent) {
        res.status(500).json({ error: `spawn error: ${err.message}` });
      }
    });

    req.on("close", () => {
      if (child.exitCode === null) {
        console.log(`[YouTube Downloader] Client cancelled request. Killing child process (PID: ${child.pid})`);
        child.kill();
      }
    });
  } catch (error: any) {
    console.error(`[YouTube Downloader] Execution failed:`, error);
    try {
      if (!res.headersSent) {
        const fallbackUrl = isVideo 
          ? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" 
          : "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
        console.warn(`[YouTube Downloader] Activating proxy fallback download stream from: ${fallbackUrl}`);
        const response = await fetch(fallbackUrl);
        if (response.ok && response.body) {
          const contentType = response.headers.get("content-type");
          if (contentType) {
            res.setHeader("Content-Type", contentType);
          }
          const nodeBuffer = await response.arrayBuffer();
          res.end(Buffer.from(nodeBuffer));
        } else {
          res.status(500).json({ error: "Download failed and fallback was unreachable." });
        }
      }
    } catch (fallbackErr) {
      console.error("[YouTube Downloader] Fallback download failed:", fallbackErr);
      if (!res.headersSent) {
        res.status(500).json({ error: "Download failed completely." });
      }
    }
  }
});

// AI Mood Playlist Generator & Smart DJ
app.post("/api/ai/mood", async (req, res) => {
  const { mood, currentTracks } = req.body;
  if (!mood) {
    return res.status(400).json({ error: "Missing mood/activity prompt" });
  }

  const cacheKey = `aimood_${String(mood).toLowerCase().replace(/\s+/g, "_")}`;
  const cached = serverDb.getCache(cacheKey);
  if (cached) {
    console.log(`[Cache Hit] AI Mood cache found for mood: "${mood}"`);
    return res.json({ tracks: cached });
  }

  let recommendedTracks = [];
  try {
    const contextStr = currentTracks && currentTracks.length > 0
      ? `The user's recent music library includes tracks like: ${currentTracks.map((t: any) => `${t.title} by ${t.artist}`).join(", ")}.`
      : "";

    const userPrompt = `
      You are playme.'s AI smart recommendations DJ.
      
      User described their current mood, vibe, or goal: "${mood}".
      ${contextStr}
      
      Generate a carefully curated smart playlist consisting of 5 distinct actual songs of various genres matching this description.
      Since they are playing this on an indian-focused, global premium app, feel free to include a blend of indian classics, regional masterpieces, deep global lo-fi, or indie rock options if appropriate.
      
      Provide your response strictly in the following JSON format:
      [
        {
          "title": "Song Title",
          "artist": "Artist Name",
          "reason": "Clear explanation of how this song fits their mood or context."
        }
      ]
    `;

    // Fetch using robust multi-model retry mechanism
    const response = await generateContentWithRetry({
      contents: userPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              artist: { type: Type.STRING },
              reason: { type: Type.STRING },
            },
            required: ["title", "artist", "reason"],
          },
        },
      },
    });

    const val = response.text?.trim() || "[]";
    recommendedTracks = JSON.parse(val);
  } catch (e: any) {
    console.log("[AI Engine] Activating high-fidelity offline curation fallback");
    // Dynamic Fallback Curation matching vibe words
    const lowerMood = mood.toLowerCase();
    if (lowerMood.includes("bollywood") || lowerMood.includes("sufi") || lowerMood.includes("rahman") || lowerMood.includes("hindi") || lowerMood.includes("india")) {
      recommendedTracks = [
        { title: "Dil Se Re", artist: "A.R. Rahman", reason: "Subcontinental masterpiece with rich classical warmth and acoustic brilliance." },
        { title: "Choo Lo", artist: "The Local Train", reason: "Indie rock classic with comforting late night guitar chords." },
        { title: "Cold / Mess", artist: "Prateek Kuhad", reason: "Intimate acoustic vocal masterpiece ideal for healing and deep thinking." },
        { title: "Blinding Lights", artist: "The Weeknd", reason: "High-flying retro synth pop crossover for balancing the soulful vibe." },
        { title: "How Long", artist: "Charlie Puth", reason: "Bouncy baseline rhythm adding pleasant pop energies." }
      ];
    } else if (lowerMood.includes("chill") || lowerMood.includes("lofi") || lowerMood.includes("relax") || lowerMood.includes("late") || lowerMood.includes("study") || lowerMood.includes("night") || lowerMood.includes("peace")) {
      recommendedTracks = [
         { title: "Cold / Mess", artist: "Prateek Kuhad", reason: "Beautiful acoustic warmth to soothe late night feelings perfectly." },
         { title: "Retro Vintage Mix", artist: "Lofi Cafe", reason: "Cozy cassette tape crackle with ambient, relaxing jazz progressions." },
         { title: "Space Station Deep House", artist: "Cosmic Horizon", reason: "Ambient, futuristic lofi electronic beats to maintain deep mental concentration." },
         { title: "Design Talks Podcast", artist: "Design Sandbox", reason: "Calming conversational background stream ideal for focus sessions." },
         { title: "How Long", artist: "Charlie Puth", reason: "Smooth bouncy bass rhythm to keep up a positive, steady study tempo." }
      ];
    } else if (lowerMood.includes("dance") || lowerMood.includes("rave") || lowerMood.includes("club") || lowerMood.includes("party") || lowerMood.includes("tech") || lowerMood.includes("house") || lowerMood.includes("energy")) {
      recommendedTracks = [
         { title: "Blinding Lights", artist: "The Weeknd", reason: "Enthralling 80s synth-wave energy to trigger movement instantly." },
         { title: "Let Me Love You", artist: "DJ Snake (ft. Justin Bieber)", reason: "Incredible drop-heavy pop EDM anthem to pump up the energy levels." },
         { title: "Club Life: Electronic", artist: "DJ Phantom", reason: "Thumping house groove ideal for dance-oriented focus." },
         { title: "Space Station Deep House", artist: "Cosmic Horizon", reason: "Futuristic techno rhythms and deep progressive chords." },
         { title: "How Long", artist: "Charlie Puth", reason: "Funky commercial dance pop rhythm." }
      ];
    } else {
      recommendedTracks = [
         { title: "Blinding Lights", artist: "The Weeknd", reason: "Globally beloved upbeat retro synth classic." },
         { title: "Dil Se Re", artist: "A.R. Rahman", reason: "Masterpiece of subcontinental fusion and acoustic composition." },
         { title: "Choo Lo", artist: "The Local Train", reason: "Indie rock twilight cords with high soulful energy." },
         { title: "Cold / Mess", artist: "Prateek Kuhad", reason: "Heartwarming indie-acoustic masterpiece." },
         { title: "Let Me Love You", artist: "DJ Snake (ft. Justin Bieber)", reason: "Energetically pleasant pop dance anthem." }
      ];
    }
  }

  try {
    // Dynamic resolution layer: Turn these metadata pieces into actual playable YouTube items
    const resolvedTracks: any[] = [];
    for (const rec of recommendedTracks) {
      const q = `${rec.artist} ${rec.title}`;
      const searchItems = await backendSearchYoutube(q, 1);
      if (searchItems.length > 0) {
        const item = searchItems[0];
        // Inject the bespoke description
        item.description = rec.reason;
        resolvedTracks.push(item);
      }
    }

    if (resolvedTracks.length > 0) {
      serverDb.setCache(cacheKey, resolvedTracks);
    }
    return res.json({ tracks: resolvedTracks });
  } catch (err: any) {
    console.error("Youtube resolution error during mood fallback:", err);
    return res.status(500).json({ error: "Could not resolve recommendations" });
  }
});

// AI Vibe Queue Generator
app.post("/api/ai/vibe-queue", async (req, res) => {
  const { title, artist, genre, history } = req.body;
  if (!title || !artist) {
    return res.status(400).json({ error: "Missing song title or artist" });
  }

  const cacheKey = `vibe_queue_${String(title).toLowerCase().replace(/\s+/g, "_")}_${String(artist).toLowerCase().replace(/\s+/g, "_")}`;
  const cached = serverDb.getCache(cacheKey);
  if (cached) {
    console.log(`[Cache Hit] AI Vibe Queue found for: "${title}" by ${artist}`);
    return res.json({ tracks: cached });
  }

  let recommendedTracks = [];
  try {
    const contextStr = history && history.length > 0
      ? `The user's recent music listening history includes: ${history.join(", ")}.`
      : "";

    const userPrompt = `
      You are playme.'s AI Vibe Recommendation Engine.
      
      The user is currently playing this song: "${title}" by "${artist}".
      ${genre ? `Genre: ${genre}.` : ""}
      ${contextStr}
      
      Generate a carefully curated list of 10 distinct real popular songs (available on YouTube Music) that have the EXACT same "vibe" as the playing song.
      To match the vibe, analyze:
      1. Genre & Artist style.
      2. Language (e.g. if the song is Hindi/Bollywood, prioritize matching Hindi/Bollywood songs; if English pop, prioritize English pop).
      3. Mood & Energy (e.g., romantic, melancholic, upbeat dance, intense workout).
      4. BPM & Rhythm.
      
      Provide your response strictly in the following JSON format:
      [
        {
          "title": "Song Title",
          "artist": "Artist Name",
          "reason": "Short explanation (8-15 words) of why this song matches the vibe."
        }
      ]
    `;

    const response = await generateContentWithRetry({
      contents: userPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              artist: { type: Type.STRING },
              reason: { type: Type.STRING },
            },
            required: ["title", "artist", "reason"],
          },
        },
      },
    });

    const val = response.text?.trim() || "[]";
    recommendedTracks = JSON.parse(val);
  } catch (e: any) {
    console.log("[AI Vibe Queue] Fallback to Spotify Recommendations or local rules:", e.message);
    
    // Fallback: Check local rules first
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes("kesariya") || lowerTitle.includes("samjhawan") || lowerTitle.includes("apna bana le") || lowerTitle.includes("heeriye")) {
      recommendedTracks = [
        { title: "Heeriye", artist: "Jasleen Royal, Arijit Singh", reason: "Similar soft romantic subcontinental vocals and acoustic strumming." },
        { title: "Apna Bana Le", artist: "Arijit Singh, Sachin-Jigar", reason: "Soulful Bollywood love ballad with high emotional resonance." },
        { title: "Chaleya", artist: "Anirudh Ravichander, Arijit Singh", reason: "Upbeat romantic crossover from recent cinema." },
        { title: "O Maahi", artist: "Pritam, Arijit Singh", reason: "Melodic mid-tempo love theme with identical acoustic vibes." },
        { title: "Tum Kya Mile", artist: "Pritam, Arijit Singh", reason: "Grand romantic Bollywood arrangement with soaring choruses." },
        { title: "Raanjhanaa", artist: "A.R. Rahman", reason: "Acoustic traditional folk-pop blend with rich classical undertones." },
        { title: "Meet", artist: "Arijit Singh, Sachin-Jigar", reason: "Delicate acoustic string pattern and comforting love theme." },
        { title: "Ve Kamleya", artist: "Pritam, Arijit Singh", reason: "Punjabi-flavored love duet matching the emotional energy." }
      ];
    } else if (lowerTitle.includes("blinding lights") || lowerTitle.includes("starboy") || lowerTitle.includes("how long") || lowerTitle.includes("cold / mess")) {
      recommendedTracks = [
        { title: "Save Your Tears", artist: "The Weeknd", reason: "Identical 80s synth-pop aesthetic and upbeat dance rhythm." },
        { title: "How Long", artist: "Charlie Puth", reason: "Bouncy bassline driven dance-pop song with similar energy." },
        { title: "Attention", artist: "Charlie Puth", reason: "Funky pop groove with highly addictive bassline patterns." },
        { title: "As It Was", artist: "Harry Styles", reason: "Catchy synth hook and upbeat tempo matching retro pop waves." },
        { title: "Levitating", artist: "Dua Lipa", reason: "Nu-disco upbeat crossover energy with similar high BPM rhythm." },
        { title: "Let Me Love You", artist: "DJ Snake, Justin Bieber", reason: "Energetic vocal pop EDM anthem with strong dance drops." },
        { title: "Starboy", artist: "The Weeknd", reason: "Moody synth groove with deep bass notes and high pop appeal." },
        { title: "Cold / Mess", artist: "Prateek Kuhad", reason: "Smooth guitar theme that acts as a soothing vocal contrast." }
      ];
    } else {
      // General fallback using Spotify Recommendations logic
      try {
        const token = await getSpotifyToken();
        if (token) {
          const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(`track:${title} artist:${artist}`)}&type=track&limit=1`;
          const searchRes = await fetch(searchUrl, { headers: { Authorization: `Bearer ${token}` } });
          if (searchRes.ok) {
            const searchData = await searchRes.json();
            const trackItem = searchData.tracks?.items?.[0];
            if (trackItem) {
              const trackId = trackItem.id;
              const artistId = trackItem.artists?.[0]?.id;
              const recsUrl = `https://api.spotify.com/v1/recommendations?limit=10&seed_tracks=${trackId}&seed_artists=${artistId}`;
              const recsRes = await fetch(recsUrl, { headers: { Authorization: `Bearer ${token}` } });
              if (recsRes.ok) {
                const recsData = await recsRes.json();
                recommendedTracks = (recsData.tracks || []).map((t: any) => ({
                  title: t.name,
                  artist: t.artists?.map((a: any) => a.name).join(", "),
                  reason: `Spotify recommendation matching ${artist}'s style.`
                }));
              }
            }
          }
        }
      } catch (spotifyErr: any) {
        console.warn("Spotify recommendations fallback failed:", spotifyErr);
      }
    }
  }

  // Ensure we have at least some tracks
  if (recommendedTracks.length === 0) {
    recommendedTracks = [
      { title: "Blinding Lights", artist: "The Weeknd", reason: "Globally beloved synth-pop masterpiece." },
      { title: "Dil Se Re", artist: "A.R. Rahman", reason: "Masterpiece of subcontinental fusion and acoustic composition." },
      { title: "Choo Lo", artist: "The Local Train", reason: "Comforting indie-acoustic twilight chords." },
      { title: "Cold / Mess", artist: "Prateek Kuhad", reason: "Intimate vocal indie acoustic ballad." }
    ];
  }

  try {
    // Resolve track metadata into playable YouTube tracks
    const resolvedTracks: any[] = [];
    for (const rec of recommendedTracks.slice(0, 10)) {
      const q = `${rec.artist} ${rec.title}`;
      const searchItems = await backendSearchYoutube(q, 1);
      if (searchItems.length > 0) {
        const item = searchItems[0];
        item.description = rec.reason; // Inject matching explanation
        resolvedTracks.push(item);
      }
    }

    if (resolvedTracks.length > 0) {
      serverDb.setCache(cacheKey, resolvedTracks);
    }
    return res.json({ tracks: resolvedTracks });
  } catch (err: any) {
    console.error("Youtube resolution error in vibe-queue:", err);
    return res.status(500).json({ error: "Could not resolve recommendations" });
  }
});

// AI Music Tutor / Bilingual cultural translator
app.post("/api/ai/tutor", async (req, res) => {
  const { title, artist, lyrics, quoteLines } = req.body;
  if (!title || !artist) {
    return res.status(400).json({ error: "Missing track title or artist" });
  }

  const cacheKey = `aitutor_${String(title).toLowerCase()}_${String(artist).toLowerCase()}_${String(quoteLines || "").toLowerCase()}`;
  const cached = serverDb.getCache(cacheKey);
  if (cached) {
    console.log(`[Cache Hit] AI Music Tutor info for keys: ${cacheKey}`);
    return res.json(cached);
  }

  try {
    const prompt = `
      You are the Playme. AI Music Tutor.
      Help the listener appreciate and learn from the song "${title}" by "${artist}".
      
      Selected core lines of the song to explain:
      "${quoteLines || "The overall song content."}"
      
      Full song lyrics for context (if available):
      ${lyrics || "Unavailable, please describe standard meanings of the song."}
      
      Provide your feedback in a clean Markdown response summarizing:
      1. **Song Meaning & Story**: The core theme, what story the lyrics are telling.
      2. **Cultural Background & Origin Details**: Any linguistic nuances, regional background trivia, slang, or idioms used in these lyrics.
      3. **Vocab & Translator Breakdown**: Break down 2-3 complex words or phrases (with translations if the song is non-English like Hindi, Spanish, Japanese, etc.) so the user can easily learn.
    `;

    const response = await generateContentWithRetry({
      contents: prompt,
    });

    const result = { feedback: response.text };
    serverDb.setCache(cacheKey, result);
    return res.json(result);
  } catch (e: any) {
    console.log("[AI Engine] Returning stand-by tutor profile");
    const fallbackResult = {
      feedback: `### AI Music Tutor (Offline Mode / High Demand Fallback)
    
We are currently experiencing extremely high demand on our AI nodes, so I have activated the high-fidelity offline tutor for **${title}** by **${artist}**.

#### **Song Meaning & Vibe**
This track is celebrated globally for its high-impact emotional resonance. The core themes revolve around passion, romantic vulnerability, nostalgia, and breakthrough emotional expression.

#### **Cultural Background & Details**
- **Sufi & Subcontinental Nuances**: If this is a South Asian masterpiece, the song leverages deep acoustic string layers, vocal layers, and mystical expressions.
- **Global Retro-Pop Influence**: If this is a global blockbuster, it uses synthwave aesthetics reminiscent of the 1980s that evoke modern nostalgia.

#### **Vocab & Lyric appreciation**
1. **Nostalgia (noun)**: A sentimental longing or wistful affection for a period in the past.
2. **Resilience (noun)**: The capacity to recover quickly from difficulties; toughness.

*Please try choosing or highlighting another lyric block once AI node queues clear up.*`
    };
    serverDb.setCache(cacheKey, fallbackResult);
    return res.json(fallbackResult);
  }
});

// AI Song Story Summary
app.post("/api/ai/summary", async (req, res) => {
  const { title, artist } = req.body;
  if (!title || !artist) {
    return res.status(400).json({ error: "Missing title or artist" });
  }

  const cacheKey = `aisummary_${String(title).toLowerCase()}_${String(artist).toLowerCase()}`;
  const cached = serverDb.getCache(cacheKey);
  if (cached) {
    console.log(`[Cache Hit] AI Summary for keys: ${cacheKey}`);
    return res.json(cached);
  }

  try {
    const prompt = `
      Summarize the fascinating "behind-the-music" story about the song "${title}" by "${artist}".
      Who wrote it? Were there controversy, legal battles, heartbreak, or breakthrough moments during its recording?
      Keep it engaging, succinct (approx 2 paragraphs max), and premium in tone.
    `;

    const response = await generateContentWithRetry({
      contents: prompt,
    });

    const result = { summary: response.text };
    serverDb.setCache(cacheKey, result);
    return res.json(result);
  } catch (e: any) {
    console.log("[AI Engine] Returning stand-by song profile");
    const fallbackResult = {
      summary: `### Song Profile (High Demand Fallback)
    
**${title}** by **${artist}** is a highly celebrated release that has captivated millions of listeners globally. 

Composed with incredible production depth, the song has achieved massive critical and commercial acclaim, featuring prominently in international or regional charts. Its unique arrangement blends multiple genre cues together into an unforgettable listening experience.`
    };
  }
});

// ==========================================
// SMTP Email Notification Endpoints (Nodemailer)
// ==========================================
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "playmeshow07@gmail.com",
    pass: "kzta wmtz yanq carm", // SMTP App Password
  },
});

// Verify email configuration on startup
transporter.verify((err, success) => {
  if (err) {
    console.error("[SMTP Server] Error configuring Nodemailer SMTP transport:", err);
  } else {
    console.log("[SMTP Server] Nodemailer transport initialized successfully. Ready to send welcome/recovery emails.");
  }
});

// 1. Welcome Email API
app.post("/api/email/welcome", async (req, res) => {
  const { email, displayName } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Missing email address" });
  }

  const name = displayName || email.split("@")[0] || "Music Lover";

  const welcomeTemplate = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Playme.</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #0b0708;
            margin: 0;
            padding: 0;
            color: #e5e9ea;
          }
          .container {
            max-width: 600px;
            margin: 30px auto;
            background: linear-gradient(135deg, #150d10 0%, #0c0809 100%);
            border: 1px solid rgba(236, 72, 153, 0.15);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0,0,0,0.8);
          }
          .header {
            padding: 40px 30px;
            text-align: center;
            background: linear-gradient(90deg, #12090c 0%, #1c0e12 100%);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          }
          .logo-text {
            font-size: 32px;
            font-weight: 800;
            letter-spacing: -1.5px;
            background: linear-gradient(135deg, #00f2ff 0%, #ff007f 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin: 0;
            display: inline-block;
          }
          .content {
            padding: 40px 35px;
            line-height: 1.6;
          }
          h1 {
            font-size: 22px;
            margin-top: 0;
            color: #ffffff;
            font-weight: 700;
          }
          p {
            font-size: 14px;
            color: rgba(229, 233, 234, 0.75);
            margin: 16px 0;
          }
          .highlight {
            color: #00f2ff;
            font-weight: 600;
          }
          .btn {
            display: inline-block;
            background: linear-gradient(90deg, #00f2ff 0%, #ff007f 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 32px;
            font-size: 13px;
            font-weight: 700;
            border-radius: 16px;
            margin: 25px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 4px 15px rgba(255, 0, 127, 0.25);
          }
          .features {
            margin: 30px 0;
            padding-top: 25px;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
          }
          .feature-item {
            margin-bottom: 15px;
          }
          .feature-title {
            color: #ffffff;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 4px;
          }
          .footer {
            padding: 30px;
            text-align: center;
            background-color: #0d0809;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            font-size: 11px;
            color: rgba(229, 233, 234, 0.4);
          }
          .footer a {
            color: #00f2ff;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo-text">play me</h1>
          </div>
          <div class="content">
            <h1>Hey ${name}, welcome to the club! 🎧</h1>
            <p>Your Playme account is officially verified. Get ready to experience your music catalog with absolute premium fidelity, completely interactive AI layers, and an offline-first sync engine.</p>
            <p>We are stoked to have you here. To celebrate, your account has been unlocked with <span class="highlight">Unlimited Offline Downloader Credits</span> so you can cache any playlist from YouTube straight into your secure local vault.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.APP_URL || 'http://localhost:3000'}" class="btn">Launch Playme App</a>
            </div>

            <div class="features">
              <div class="feature-item">
                <div class="feature-title">⚡ Smart Offline Cache</div>
                <p style="margin: 0; font-size: 12px; color: rgba(229, 233, 234, 0.55);">Download and play high-fidelity music offline without active connectivity. Safe & local.</p>
              </div>
              <div class="feature-item">
                <div class="feature-title">🧠 Bilingual AI Music Tutor</div>
                <p style="margin: 0; font-size: 12px; color: rgba(229, 233, 234, 0.55);">Translate and unlock cultural background trivia about any song in real-time.</p>
              </div>
              <div class="feature-item">
                <div class="feature-title">🔮 Mood Playlist DJ</div>
                <p style="margin: 0; font-size: 12px; color: rgba(229, 233, 234, 0.55);">Simply describe your vibe and let our server-side neural nets generate the soundtrack.</p>
              </div>
            </div>

            <p style="margin-bottom: 0;">Turn it up,<br><strong>The Playme Team</strong></p>
          </div>
          <div class="footer">
            <p style="margin: 0 0 10px 0;">This email is sent on behalf of Playme AccessPortal. If you did not create an account, please disregard.</p>
            <p style="margin: 0;">© 2026 Playme Music. All rights reserved. <a href="#">Privacy Policy</a> • <a href="#">Terms</a></p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Playme Music" <playmeshow07@gmail.com>`,
      to: email,
      subject: "Welcome to Playme. — Your AI Music Vault is Ready! 🎧",
      html: welcomeTemplate,
    });
    console.log(`[SMTP Server] Welcome email dispatched successfully to: ${email}`);
    return res.json({ success: true, message: "Welcome email dispatched" });
  } catch (error: any) {
    console.error("[SMTP Server] Welcome email dispatch failure:", error);
    return res.status(500).json({ error: `SMTP failure: ${error.message}` });
  }
});

// 2. Recovery Password Email API
app.post("/api/email/recovery", async (req, res) => {
  const { email, recoveryCode } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Missing email address" });
  }

  const code = recoveryCode || Math.random().toString(36).substring(2, 8).toUpperCase();

  const recoveryTemplate = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Playme Security Keys</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #0b0708;
            margin: 0;
            padding: 0;
            color: #e5e9ea;
          }
          .container {
            max-width: 600px;
            margin: 30px auto;
            background: linear-gradient(135deg, #150d10 0%, #0c0809 100%);
            border: 1px solid rgba(0, 242, 255, 0.15);
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0,0,0,0.8);
          }
          .header {
            padding: 40px 30px;
            text-align: center;
            background: linear-gradient(90deg, #12090c 0%, #0e1c1c 100%);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          }
          .logo-text {
            font-size: 32px;
            font-weight: 800;
            letter-spacing: -1.5px;
            background: linear-gradient(135deg, #00f2ff 0%, #ff007f 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin: 0;
            display: inline-block;
          }
          .content {
            padding: 40px 35px;
            line-height: 1.6;
          }
          h1 {
            font-size: 22px;
            margin-top: 0;
            color: #ffffff;
            font-weight: 700;
          }
          p {
            font-size: 14px;
            color: rgba(229, 233, 234, 0.75);
            margin: 16px 0;
          }
          .code-box {
            background-color: rgba(255, 255, 255, 0.03);
            border: 1px dashed rgba(0, 242, 255, 0.3);
            border-radius: 16px;
            padding: 20px;
            text-align: center;
            font-size: 24px;
            font-weight: 800;
            color: #00f2ff;
            letter-spacing: 6px;
            font-family: monospace;
            margin: 30px 0;
            box-shadow: inset 0 0 15px rgba(0, 242, 255, 0.05);
          }
          .btn {
            display: inline-block;
            background: linear-gradient(90deg, #00f2ff 0%, #ff007f 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 32px;
            font-size: 13px;
            font-weight: 700;
            border-radius: 16px;
            margin: 10px 0 25px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 4px 15px rgba(255, 0, 127, 0.25);
          }
          .footer {
            padding: 30px;
            text-align: center;
            background-color: #0d0809;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            font-size: 11px;
            color: rgba(229, 233, 234, 0.4);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo-text">play me</h1>
          </div>
          <div class="content">
            <h1>Reset your security credentials 🔑</h1>
            <p>We received a request to recover the security keys for your Playme account. If you did not initiate this request, you can safely ignore this email; your password remains secure.</p>
            <p>To set new account credentials, use the verification security code below in your AccessPortal:</p>
            
            <div class="code-box">${code}</div>

            <p style="font-size: 12px; color: rgba(229, 233, 234, 0.55); margin-top: -10px; margin-bottom: 25px; text-align: center;">This code will remain active for 15 minutes before expiring.</p>

            <p style="margin-bottom: 0;">Play secure,<br><strong>The Playme Team</strong></p>
          </div>
          <div class="footer">
            <p style="margin: 0 0 10px 0;">This email is sent on behalf of Playme AccessPortal. If you did not request a password recovery, please ignore.</p>
            <p style="margin: 0;">© 2026 Playme Music. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Playme Music" <playmeshow07@gmail.com>`,
      to: email,
      subject: `Reset your Playme security keys: ${code} 🔑`,
      html: recoveryTemplate,
    });
    console.log(`[SMTP Server] Password recovery email dispatched successfully to: ${email}`);
    return res.json({ success: true, code, message: "Recovery email dispatched" });
  } catch (error: any) {
    console.error("[SMTP Server] Recovery email dispatch failure:", error);
    return res.status(500).json({ error: `SMTP failure: ${error.message}` });
  }
});

const JWT_SECRET = process.env.JWT_SECRET || "playme-super-secret-key-1729";

// Middleware to authenticate JWT token
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: "Access token is required" });
  
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
}

// 1. POST /api/auth/signup
app.post("/api/auth/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    const existingUser = userDb.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "This email is already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const user = userDb.create(name, email, passwordHash);
    
    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    
    // Send welcome email using Nodemailer
    if (transporter) {
      const welcomeTemplate = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Welcome to Playme.</title>
          </head>
          <body style="font-family: sans-serif; background-color: #0b0708; color: #e5e9ea; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: #150d10; padding: 30px; border-radius: 16px; border: 1px solid rgba(0, 242, 255, 0.1);">
              <h2 style="color: #00f2ff;">Hey ${name}, welcome to the club! 🎧</h2>
              <p>Your Playme account has been created successfully. Get ready to experience your music catalog with absolute premium fidelity, completely interactive AI layers, and an offline-first sync engine.</p>
              <p>We are stoked to have you here. Turn it up!</p>
              <p><strong>The Playme Team</strong></p>
            </div>
          </body>
        </html>
      `;
      transporter.sendMail({
        from: `"Playme Music" <playmeshow07@gmail.com>`,
        to: user.email,
        subject: "Welcome to Playme. — Your AI Music Vault is Ready! 🎧",
        html: welcomeTemplate,
      }).catch(err => console.error("[SMTP Welcome Error]", err));
    }
    
    res.status(201).json({
      token,
      user: {
        uid: user.id,
        email: user.email,
        displayName: user.name,
        avatar: user.avatar,
        provider: "password",
        isVerified: user.isVerified,
        phoneNumber: user.phoneNumber,
        createdAt: new Date(user.createdAt).toISOString()
      }
    });
  } catch (err: any) {
    console.error("[Auth API] Signup failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 2. POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = userDb.findByEmail(email);
    if (!user) {
      return res.status(400).json({ error: "Incorrect email or password" });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(400).json({ error: "Incorrect email or password" });
    }

    // Update last login
    userDb.update(user.id, { lastLogin: Date.now() });

    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: {
        uid: user.id,
        email: user.email,
        displayName: user.name,
        avatar: user.avatar,
        provider: "password",
        isVerified: user.isVerified,
        phoneNumber: user.phoneNumber,
        createdAt: new Date(user.createdAt).toISOString()
      }
    });
  } catch (err: any) {
    console.error("[Auth API] Login failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 3. GET /api/auth/me
app.get("/api/auth/me", authenticateToken, (req: any, res) => {
  try {
    const user = userDb.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      uid: user.id,
      email: user.email,
      displayName: user.name,
      avatar: user.avatar,
      provider: "password",
      isVerified: user.isVerified,
      phoneNumber: user.phoneNumber,
      createdAt: new Date(user.createdAt).toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// 4. POST /api/auth/send-verification
app.post("/api/auth/send-verification", authenticateToken, async (req: any, res) => {
  try {
    const user = userDb.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const verificationToken = crypto.randomBytes(20).toString("hex");
    const verificationTokenExpiry = Date.now() + 24 * 3600000; // 24 hours

    userDb.update(user.id, { verificationToken, verificationTokenExpiry });

    if (transporter) {
      const host = req.get("host") || "localhost:3000";
      const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
      const verifyLink = `${protocol}://${host}/?verify_token=${verificationToken}`;
      
      const mailOptions = {
        from: `"Playme Music" <playmeshow07@gmail.com>`,
        to: user.email,
        subject: "Playme - Verify Your Email",
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid rgba(255,255,255,0.05); background: #150d10; color: #e5e9ea; border-radius: 12px;">
            <h2 style="color: #00f2ff; text-align: center;">Verify Your Playme Account</h2>
            <p>Greetings ${user.name},</p>
            <p>Thank you for joining Playme. Click the button below to verify your email address and unlock full dashboard features. This link expires in 24 hours.</p>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${verifyLink}" style="background-color: #00f2ff; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email</a>
            </div>
            <p style="font-size: 11px; color: #777;">If you did not request this, you can ignore this email safely.</p>
          </div>
        `
      };
      await transporter.sendMail(mailOptions);
      console.log(`[SMTP] Verification email sent to:`, user.email);
    }

    res.json({ message: "Verification email sent successfully!" });
  } catch (err: any) {
    console.error("[Auth API] Send verification failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 5. POST /api/auth/verify
app.post("/api/auth/verify", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Verification token is required" });
  }

  try {
    const user = userDb.findByVerificationToken(token);
    if (!user) {
      return res.status(400).json({ error: "Invalid or expired verification token" });
    }

    userDb.update(user.id, {
      isVerified: true,
      verificationToken: undefined,
      verificationTokenExpiry: undefined
    });

    res.json({ message: "Email verified successfully!" });
  } catch (err: any) {
    console.error("[Auth API] Verify email failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 6. POST /api/auth/update-profile
app.post("/api/auth/update-profile", authenticateToken, async (req: any, res) => {
  const { displayName, phoneNumber } = req.body;
  
  try {
    const user = userDb.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updates: any = {};
    if (displayName !== undefined) {
      if (!displayName.trim()) {
        return res.status(400).json({ error: "Display name cannot be empty" });
      }
      updates.name = displayName.trim();
    }
    if (phoneNumber !== undefined) {
      updates.phoneNumber = phoneNumber.trim();
    }

    const updatedUser = userDb.update(user.id, updates);
    if (!updatedUser) {
      return res.status(500).json({ error: "Failed to update profile" });
    }

    res.json({
      message: "Profile updated successfully!",
      user: {
        uid: updatedUser.id,
        email: updatedUser.email,
        displayName: updatedUser.name,
        avatar: updatedUser.avatar,
        provider: "password",
        isVerified: updatedUser.isVerified,
        phoneNumber: updatedUser.phoneNumber,
        createdAt: new Date(updatedUser.createdAt).toISOString()
      }
    });
  } catch (err: any) {
    console.error("[Auth API] Update profile failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 7. POST /api/auth/forgot
app.post("/api/auth/forgot", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const user = userDb.findByEmail(email);
    if (!user) {
      // Return 200 for security, but skip sending email
      return res.json({ message: "If that email exists, we have sent a password reset link." });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    userDb.update(user.id, { resetToken, resetTokenExpiry });

    if (transporter) {
      const resetLink = `${req.protocol}://${req.get("host")}/?reset_token=${resetToken}`;
      const mailOptions = {
        from: `"Playme Music" <playmeshow07@gmail.com>`,
        to: user.email,
        subject: "Playme - Reset Your Password",
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid rgba(255,255,255,0.05); background: #150d10; color: #e5e9ea; border-radius: 12px;">
            <h2 style="color: #00f2ff; text-align: center;">Playme Vault Recovery</h2>
            <p>Greetings ${user.name},</p>
            <p>We received a request to recover your password keys. Click the button below to reset your password. This link expires in 1 hour.</p>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${resetLink}" style="background-color: #00f2ff; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p style="font-size: 11px; color: #777;">If you did not request this, you can ignore this email safely.</p>
          </div>
        `
      };
      await transporter.sendMail(mailOptions);
      console.log(`[SMTP] Recovery link sent to:`, user.email);
    }

    res.json({ message: "If that email exists, we have sent a password reset link." });
  } catch (err: any) {
    console.error("[Auth API] Forgot password failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 8. POST /api/auth/reset
app.post("/api/auth/reset", async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: "Token and password are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    const user = userDb.findByResetToken(token);
    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    userDb.update(user.id, {
      passwordHash,
      resetToken: undefined,
      resetTokenExpiry: undefined
    });

    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (err: any) {
    console.error("[Auth API] Reset password failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// Cloud Sync API — Cross-Device User Data
// ==========================================

// GET /api/user/sync — Fetch the user's cloud-saved data
app.get("/api/user/sync", authenticateToken, (req: any, res: any) => {
  try {
    const data = userDb.getUserSyncData(req.user.id);
    if (!data) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(data);
  } catch (err: any) {
    console.error("[Sync API] GET /api/user/sync failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/user/sync — Save the user's data to cloud
app.post("/api/user/sync", authenticateToken, (req: any, res: any) => {
  try {
    const { favorites, followedArtists, history, settings } = req.body;
    const updated = userDb.syncUserData(req.user.id, {
      favorites,
      followedArtists,
      history,
      settings,
    });
    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ success: true, message: "User data synced to cloud" });
  } catch (err: any) {
    console.error("[Sync API] POST /api/user/sync failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// Vite Dev & Production Integration middleware
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server fully operational on http://localhost:${PORT}`);
  });
}

startServer();
