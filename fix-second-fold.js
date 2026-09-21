const fs = require('fs');
const file = 'src/components/MavFarmView.tsx';
let content = fs.readFileSync(file, 'utf-8');

const startMarker = '{/* Circular Tracks Carousel Slider */}';
const endMarker = '{/* Two-Column Grid: About Artist (Left) & Credits + Queue (Right) */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.log('Markers not found');
  process.exit(1);
}

// Ensure we get the start of the line for startMarker
const startOfLineIndex = content.lastIndexOf('\n', startIndex) + 1;

// The replacement text
const amazonSecondFold = `                    {/* Related Artists (Amazon Style Circular) */}
                  {lyricMode === 'off' && currentTrack && (
                    <div className="mt-4 pb-16 w-full text-left">
                      <div className="border-t border-white/10 my-8 w-full" />

                      {/* Related Artists */}
                      <div className="px-4 md:px-8 w-full max-w-[1400px] mx-auto animate-fade-in">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">Related artists</h3>
                          <div className="flex items-center gap-2">
                            <button className="p-1 text-white/50 hover:text-white cursor-pointer"><SkipBack size={18} /></button>
                            <button className="p-1 text-white/50 hover:text-white cursor-pointer"><SkipForward size={18} /></button>
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
                            <button className="p-1 text-white/50 hover:text-white cursor-pointer"><SkipBack size={18} /></button>
                            <button className="p-1 text-white/50 hover:text-white cursor-pointer"><SkipForward size={18} /></button>
                          </div>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-8 scrollbar-none snap-x mb-8">
                          {allTracks.filter(t => t.id !== currentTrack?.id).slice(0, 8).map((track, i) => {
                            const colors = ['bg-orange-500', 'bg-purple-600', 'bg-blue-600', 'bg-pink-500', 'bg-emerald-600', 'bg-red-500'];
                            const color = colors[i % colors.length];
                            return (
                              <div key={'pl-'+track.id} onClick={() => playTrack(track, allTracks)} className="shrink-0 snap-start cursor-pointer group w-[140px] md:w-[160px]">
                                <div className={\`aspect-square w-full rounded-xl overflow-hidden relative shadow-lg \${color}\`}>
                                  <img src={track.coverUrl} className="w-full h-full object-cover mix-blend-overlay opacity-60 group-hover:scale-105 transition-transform duration-500" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3">
                                    <span className="text-white font-black text-sm uppercase leading-tight drop-shadow-md">
                                      {track.artist.split(' ')[0]} <br/> Vibes
                                    </span>
                                  </div>
                                  <div className={\`absolute bottom-0 left-0 right-0 h-1 \${color} brightness-150\`}></div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      `;

// Splice
content = content.substring(0, startOfLineIndex) + amazonSecondFold + content.substring(endIndex);

fs.writeFileSync(file, content);
console.log('Successfully replaced Second Fold!');
