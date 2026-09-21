import re

with open("src/components/MavFarmView.tsx", "r") as f:
    content = f.read()

# 1. Replace Cover Art with Amazon Header
old_cover_pattern = re.compile(
    r"\{lyricMode === 'off' && !isYtActive && \(\s*<div className=\"w-full flex justify-center py-6 md:py-10 animate-floating shrink-0\">.*?</div>\s*\)\}",
    re.DOTALL
)

amazon_header = """{lyricMode === 'off' && !isYtActive && (
                              <div className="flex flex-col lg:flex-row gap-6 md:gap-10 items-center lg:items-end px-4 md:px-8 mt-4 md:mt-12 mb-8 w-full max-w-[1400px] mx-auto animate-fade-in">
                                {/* Left: Square Cover Art */}
                                <div className="shrink-0 group relative">
                                  <div className="absolute -inset-2 bg-gradient-to-r from-[#00f2ff]/20 to-pink-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-lg"></div>
                                  <img src={currentTrack.coverUrl} className="w-56 h-56 sm:w-64 sm:h-64 md:w-80 md:h-80 object-cover rounded-md shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative z-10 border border-white/5" />
                                </div>
                                
                                {/* Right: Info and Controls */}
                                <div className="flex flex-col justify-end text-center lg:text-left w-full min-w-0 pb-2">
                                  <span className="text-[#00c8ff] text-[10px] md:text-xs font-black uppercase tracking-[0.25em] mb-2 md:mb-3">SONG</span>
                                  <h2 className="text-white font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight drop-shadow-2xl mb-1 md:mb-2 line-clamp-2">{currentTrack.title}</h2>
                                  <p className="text-white/90 text-lg md:text-2xl font-medium mb-1 truncate">{currentTrack.artist}</p>
                                  <p className="text-white/50 text-[10px] md:text-xs font-mono uppercase tracking-widest mb-4 md:mb-6">{formatTime(duration)} • 2026</p>
                                  
                                  <div className="flex items-center justify-center lg:justify-start gap-2 mb-6">
                                     <span className="bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-sm text-[9px] font-bold text-white/70 tracking-wider">LYRICS</span>
                                     <span className="bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-sm text-[9px] font-bold text-white/70 tracking-wider">ULTRA HD</span>
                                  </div>

                                  {/* Controls Row */}
                                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 md:gap-4">
                                    <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="flex items-center gap-2 bg-[#00f2ff] text-black font-bold text-sm px-6 py-2.5 rounded-full hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-[#00f2ff]/20">
                                       {isPlaying ? <Pause size={16} className="fill-black" /> : <Play size={16} className="fill-black ml-0.5" />}
                                       {isPlaying ? 'Pause' : 'Play'}
                                    </button>
                                    
                                    <button onClick={(e) => { e.stopPropagation(); toggleFavorite(currentTrack.id); }} className={`p-2.5 rounded-full border transition-all hover:scale-110 active:scale-95 ${isFavorite(currentTrack.id) ? 'bg-pink-500/20 text-pink-500 border-pink-500/30' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'}`}>
                                      <Heart size={18} className={isFavorite(currentTrack.id) ? 'fill-pink-500' : ''} />
                                    </button>
                                    
                                    <button className="p-2.5 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white hover:scale-110 active:scale-95 transition-all"><Activity size={18} /></button>
                                    <button className="p-2.5 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white hover:scale-110 active:scale-95 transition-all"><Share2 size={18} /></button>
                                    <button className="p-2.5 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white hover:scale-110 active:scale-95 transition-all"><Flag size={18} /></button>
                                    <button className="p-2.5 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white hover:scale-110 active:scale-95 transition-all"><Plus size={18} /></button>
                                  </div>

                                  {/* Progress and Lyrics tools */}
                                  <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mt-6 md:mt-8 w-full max-w-2xl mx-auto lg:mx-0">
                                    {/* Progress bar info */}
                                    <div className="flex-grow w-full space-y-1.5 md:space-y-2">
                                      <div className="flex justify-between text-[9px] text-white/50 font-bold uppercase tracking-widest font-mono">
                                        <span>{formatTime(currentTime)}</span>
                                        <span>{formatTime(duration)}</span>
                                      </div>
                                      <div 
                                        onClick={handleProgressClick}
                                        className="playback-bar bg-white/20 h-1.5 rounded-full cursor-pointer relative group"
                                      >
                                        <div 
                                          className="playback-progress bg-[#00f2ff] h-full rounded-full transition-all duration-100 relative"
                                          style={{ width: `${progressPercent}%` }}
                                        >
                                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full scale-0 group-hover:scale-100 transition-all shadow-md" />
                                        </div>
                                      </div>
                                    </div>

                                    {/* Lyrics Togglers */}
                                    <div className="flex items-center gap-2 shrink-0">
                                      <div className="flex bg-white/5 border border-white/10 rounded-full p-1 select-none">
                                        <button onClick={() => { setLyricMode('off'); if (videoOpacity === 0.12) setVideoOpacity(1.0); }} className={`p-1.5 rounded-full transition-all cursor-pointer ${lyricMode === 'off' ? 'bg-white/20 text-white shadow-sm' : 'text-white/50 hover:text-white/80'}`} title="Lyrics Off"><EyeOff size={12} /></button>
                                        <button onClick={() => { setLyricMode('line'); setVideoOpacity(0.12); }} className={`p-1.5 rounded-full transition-all cursor-pointer ${lyricMode === 'line' ? 'bg-[#00f2ff]/20 text-[#00f2ff] shadow-sm' : 'text-white/50 hover:text-white/80'}`} title="Line Lyrics"><AlignLeft size={12} /></button>
                                        <button onClick={() => { setLyricMode('scroll'); setVideoOpacity(0.12); }} className={`p-1.5 rounded-full transition-all cursor-pointer ${lyricMode === 'scroll' ? 'bg-[#00f2ff]/20 text-[#00f2ff] shadow-sm' : 'text-white/50 hover:text-white/80'}`} title="Scroll Lyrics"><ScrollText size={12} /></button>
                                      </div>
                                      <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-1 select-none text-white/50">
                                        <button onClick={() => setLyricsOffset(lyricsOffset - 0.5)} className="p-1 hover:bg-white/10 rounded-full cursor-pointer"><Minus size={10} /></button>
                                        <span className="font-mono font-bold text-[#00f2ff] px-1 text-[9px] w-[30px] text-center">{lyricsOffset === 0 ? 'SYNC' : `${lyricsOffset > 0 ? '+' : ''}${lyricsOffset.toFixed(1)}s`}</span>
                                        <button onClick={() => setLyricsOffset(lyricsOffset + 0.5)} className="p-1 hover:bg-white/10 rounded-full cursor-pointer"><Plus size={10} /></button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}"""
                            
content = old_cover_pattern.sub(amazon_header, content)

# 2. Remove Old Dashboard Song Title
old_title_pattern = re.compile(
    r"\{/\* Normal Dashboard Song Title \+ Artist \(Only shown when lyrics are off\) \*/\}.*?\{lyricMode === 'off' && \(\s*<div className=\"flex flex-col space-y-1 text-left min-w-0 shrink-0 mt-4 pb-2 animate-fade-in\">.*?</div>\s*\)\}",
    re.DOTALL
)
content = old_title_pattern.sub("", content)

# 3. Remove Responsive Player Controls
old_controls_pattern = re.compile(
    r"\{/\* Responsive Player Controls near hero \*/\}.*?<div className=\"mt-4 md:mt-8 flex items-center space-x-4 md:space-x-6\">.*?</div>\s*</div>\s*</div>",
    re.DOTALL
)
# We only want to remove the `<div className="mt-4 md:mt-8 flex... ">...</div>` block.
# Actually, the best way to match it is from `{/* Responsive Player Controls near hero */}`
# up to the end of that div, which ends right before `</div> </div>` (the closing tags for 1040 and 1038)
# We can just replace the `{/* Responsive Player Controls near hero */}` block with an empty string.

def remove_balanced_block(text, start_str):
    start_idx = text.find(start_str)
    if start_idx == -1: return text
    
    # Find the next `<div` after the start_str
    div_start = text.find("<div", start_idx)
    
    # Count braces to find the matching `</div>`
    count = 0
    idx = div_start
    while idx < len(text):
        if text[idx:idx+4] == "<div":
            count += 1
            idx += 4
        elif text[idx:idx+6] == "</div>":
            count -= 1
            idx += 6
            if count == 0:
                # Found the matching closing div
                return text[:start_idx] + text[idx:]
        else:
            idx += 1
    return text

content = remove_balanced_block(content, "{/* Responsive Player Controls near hero */}")
content = remove_balanced_block(content, "{/* Circular Tracks Carousel Slider */}")

# 4. Rewrite the Second Fold items (Related tracks -> Related Artists, Favorites -> Related Playlists)
# Find the start of `{/* SECOND FOLD...` and end before `{/* Two-Column Grid...`
second_fold_start = "{/* SECOND FOLD: Spotify-like details (Related tracks, Artist bio, Credits, Next Queue) */}"
two_column_start = "{/* Two-Column Grid: About Artist (Left) & Credits + Queue (Right) */}"

if second_fold_start in content and two_column_start in content:
    start_idx = content.find(second_fold_start)
    end_idx = content.find(two_column_start)
    
    # We must preserve the `{lyricMode === 'off' && currentTrack && (` which is right after second_fold_start
    new_second_fold = """{/* SECOND FOLD: Spotify-like details (Related tracks, Artist bio, Credits, Next Queue) */}
                  {lyricMode === 'off' && currentTrack && (
                    <div className="mt-4 pb-16 w-full text-left">
                      <div className="border-t border-white/10 my-8 w-full" />

                      {/* Related Artists (Amazon Style Circular) */}
                      <div className="px-4 md:px-8 w-full max-w-[1400px] mx-auto animate-fade-in">
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
                              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-transparent group-hover:border-[#00f2ff] transition-all">
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
                      </div>

"""
    content = content[:start_idx] + new_second_fold + content[end_idx:]

with open("src/components/MavFarmView.tsx", "w") as f:
    f.write(content)
print("Finished rewriting seamlessly.")
