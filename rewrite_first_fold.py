import re

with open("src/components/MavFarmView.tsx", "r") as f:
    content = f.read()

# Replace Cover Art Block
old_cover_art = """                            {lyricMode === 'off' && !isYtActive && (
                              <div className="w-full flex justify-center py-6 md:py-10 animate-floating shrink-0">
                                <div className="relative group select-none">
                                  {/* Soft ambient glow behind cover */}
                                  <div 
                                    className="absolute -inset-1.5 rounded-[24px] bg-gradient-to-r from-pink-500/30 to-purple-600/30 blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500"
                                  />
                                  <img
                                    src={currentTrack.coverUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60'}
                                    alt={currentTrack.title}
                                    className="w-48 h-48 sm:w-56 sm:h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 object-cover rounded-[24px] border border-white/10 shadow-[0_24px_50px_rgba(0,0,0,0.6)] relative z-10 select-none pointer-events-none"
                                  />
                                </div>
                              </div>
                            )}"""

new_cover_and_info = """                            {lyricMode === 'off' && !isYtActive && (
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

if old_cover_art in content:
    content = content.replace(old_cover_art, new_cover_and_info)
    print("Replaced cover art block.")
else:
    print("Could not find old_cover_art block.")

# Now remove the old controls block
# Search from: {/* Normal Dashboard Song Title + Artist (Only shown when lyrics are off) */}
# to end of: </div> {/* End of flex items-center space-x-4 md:space-x-6 */}
# which is right before: </div> </div> )} {/* Background Video Mode Selector for YouTube media */}
start_marker = "{/* Normal Dashboard Song Title + Artist (Only shown when lyrics are off) */}"
end_marker = "</div>\n                      </div>\n                    </div>"
# Wait, parsing this by regex is hard. Let's just find the start and carefully delete up to line 1481.
