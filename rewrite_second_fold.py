import re

with open("src/components/MavFarmView.tsx", "r") as f:
    content = f.read()

start_marker = "{/* Circular Tracks Carousel Slider */}"
end_marker_1 = "{/* SECOND FOLD: Spotify-like details (Related tracks, Artist bio, Credits, Next Queue) */}"
end_marker_2 = "{/* Two-Column Grid: About Artist (Left) & Credits + Queue (Right) */}"

if start_marker in content and end_marker_2 in content:
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker_2)
    
    new_second_fold = """
                    {/* Related Artists (Amazon Style Circular) */}
                    {lyricMode === 'off' && currentTrack && (
                      <div className="mt-8 px-4 md:px-8 w-full max-w-[1400px] mx-auto text-left animate-fade-in">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">Related artists</h3>
                          <div className="flex items-center gap-2">
                            <button className="p-1 text-white/50 hover:text-white"><SkipBack size={18} /></button>
                            <button className="p-1 text-white/50 hover:text-white"><SkipForward size={18} /></button>
                          </div>
                        </div>
                        <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-none snap-x">
                          {carouselTracks.slice(0, 8).map(({track}, i) => (
                            <div key={track.id + '-' + i} onClick={() => playTrack(track, allTracks)} className="flex flex-col items-center gap-3 shrink-0 snap-start group cursor-pointer w-[120px] md:w-[140px]">
                              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-transparent group-hover:border-[#1ed760] transition-all">
                                <img src={track.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              </div>
                              <p className="text-xs font-medium text-white/90 truncate w-full text-center group-hover:text-white">{track.artist}</p>
                            </div>
                          ))}
                        </div>

                        {/* Related Playlists (Amazon Style Square Genre Cards) */}
                        <div className="mt-6 flex items-center justify-between mb-4">
                          <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">Related playlists</h3>
                          <div className="flex items-center gap-2">
                            <button className="p-1 text-white/50 hover:text-white"><SkipBack size={18} /></button>
                            <button className="p-1 text-white/50 hover:text-white"><SkipForward size={18} /></button>
                          </div>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-8 scrollbar-none snap-x mb-8">
                          {allTracks.filter(t => t.id !== currentTrack.id).slice(0, 8).map((track, i) => {
                            const colors = ['bg-orange-500', 'bg-purple-600', 'bg-blue-600', 'bg-pink-500', 'bg-emerald-600', 'bg-red-500'];
                            const color = colors[i % colors.length];
                            return (
                              <div key={'pl-'+track.id} onClick={() => playTrack(track, allTracks)} className="shrink-0 snap-start cursor-pointer group w-[140px] md:w-[160px]">
                                <div className={`aspect-square w-full rounded-xl overflow-hidden relative shadow-lg ${color}`}>
                                  <img src={track.coverUrl} className="w-full h-full object-cover mix-blend-overlay opacity-60 group-hover:scale-105 transition-transform duration-500" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3">
                                    <span className="text-white font-black text-sm uppercase leading-tight drop-shadow-md">
                                      {track.artist.split(' ')[0]} <br/> Vibes
                                    </span>
                                  </div>
                                  <div className={`absolute bottom-0 left-0 right-0 h-1 ${color} brightness-150`}></div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        
                        {/* Credits & Next Queue (from old layout but stacked for Amazon feel) */}
                        """

    new_content = content[:start_idx] + new_second_fold + content[end_idx:]
    with open("src/components/MavFarmView.tsx", "w") as f:
        f.write(new_content)
    print("Replaced carousel and old Second Fold successfully.")
else:
    print("Could not find start or end markers for second fold.")
