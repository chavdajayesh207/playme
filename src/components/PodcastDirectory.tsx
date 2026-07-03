import React, { useState, useEffect } from 'react';
import { getChannelInfo, searchYoutubeMusic } from '../lib/youtube';
import { PODCAST_HOSTS } from '../data';
import { Loader2, Users, Podcast } from 'lucide-react';
import { useAudioPlayer } from './AudioPlayerContext';

interface ChannelData {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  subscriberCount: string;
}

export const PodcastDirectory: React.FC = () => {
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { playTrack, allTracks } = useAudioPlayer();

  useEffect(() => {
    const fetchChannels = async () => {
      setLoading(true);
      try {
        // Fetch in batches to avoid overwhelming the network
        const batchSize = 5;
        const results: ChannelData[] = [];
        
        for (let i = 0; i < PODCAST_HOSTS.length; i += batchSize) {
          const batch = PODCAST_HOSTS.slice(i, i + batchSize);
          const promises = batch.map(async (host) => {
            try {
              return await getChannelInfo(host);
            } catch (err) {
              console.warn(`Failed to fetch channel for ${host}`);
              return null;
            }
          });
          
          const batchResults = await Promise.all(promises);
          results.push(...batchResults.filter(Boolean) as ChannelData[]);
        }
        
        setChannels(results);
      } catch (err: any) {
        setError(err.message || 'Failed to load podcast directory');
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, []);

  const formatSubscribers = (count: string) => {
    const num = parseInt(count, 10);
    if (isNaN(num)) return count;
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return count;
  };



  if (loading && channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[#00f2ff]">
        <Loader2 size={32} className="animate-spin mb-4" />
        <p className="text-sm font-semibold">Loading Original Podcast Directory...</p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-headline-lg text-2xl font-bold text-white tracking-tight">Global & Indian Podcast Hosts</h3>
          <p className="text-xs text-[#b9cacb] mt-1">Listen to original creators that change the world.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {channels.map((channel) => (
          <div 
            key={channel.id} 
            onClick={() => {
              localStorage.setItem('playme_pending_podcast_host', channel.title);
              window.dispatchEvent(new CustomEvent('navigate-to-podcast-host', { detail: { hostName: channel.title } }));
            }}
            className="cursor-pointer bg-[#1c1b1c]/60 border border-white/5 hover:border-[#00f2ff]/30 rounded-2xl p-4 flex flex-col items-center text-center transition-all hover:bg-white/5 hover:-translate-y-1 group"
          >
            <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-2 border-transparent group-hover:border-[#00f2ff]/50 transition-colors relative">
              <img src={channel.thumbnail} alt={channel.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Podcast size={20} className="text-[#00f2ff]" />
              </div>
            </div>
            <h4 className="font-semibold text-sm text-white truncate w-full" title={channel.title}>
              {channel.title}
            </h4>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-[#b9cacb] bg-black/30 px-2 py-0.5 rounded-full">
              <Users size={12} className="text-[#00f2ff]" />
              <span className="font-mono">{formatSubscribers(channel.subscriberCount)} subs</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
