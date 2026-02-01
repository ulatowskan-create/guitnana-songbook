
import React, { useMemo } from 'react';
import { Song } from '../types';

interface SongListProps {
  songs: Song[];
  searchQuery: string;
  onSelectSong: (id: string) => void;
  selectedSongId: string | null;
}

const HippieSmallFlower = ({ color, centerColor = "#000", className = "w-8 h-8" }: { color: string, centerColor?: string, className?: string }) => (
  <svg className={`${className} flower-sway`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="25" r="20" fill={color} stroke="black" strokeWidth="6" />
    <circle cx="75" cy="42" r="20" fill={color} stroke="black" strokeWidth="6" />
    <circle cx="65" cy="72" r="20" fill={color} stroke="black" strokeWidth="6" />
    <circle cx="35" cy="72" r="20" fill={color} stroke="black" strokeWidth="6" />
    <circle cx="25" cy="42" r="20" fill={color} stroke="black" strokeWidth="6" />
    <circle cx="50" cy="50" r="15" fill={centerColor} stroke="black" strokeWidth="6" />
  </svg>
);

const SongList: React.FC<SongListProps> = ({ songs, searchQuery, onSelectSong, selectedSongId }) => {
  const colors = ["#FF4500", "#FF69B4", "#32CD32", "#1E90FF", "#FFD700", "#9370DB"];

  const filteredAndGroupedSongs = useMemo(() => {
    const filtered = songs.filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.band.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const grouped: { [key: string]: Song[] } = {};
    filtered.forEach(song => {
      const bandName = song.band || 'Nieznany Zespół';
      if (!grouped[bandName]) grouped[bandName] = [];
      grouped[bandName].push(song);
    });

    return Object.keys(grouped).sort().map(band => ({
      band,
      songs: grouped[band].sort((a, b) => a.title.localeCompare(b.title))
    }));
  }, [songs, searchQuery]);

  return (
    <div className="space-y-20 pb-32">
      {filteredAndGroupedSongs.map(({ band, songs }, bandIdx) => (
        <div key={band} className="space-y-8 animate-fade-in" style={{ animationDelay: `${bandIdx * 0.1}s` }}>
          {/* Band Header - Now much larger and dominant */}
          <div className="flex items-center gap-6 px-2 group">
            <div className="transform transition-transform group-hover:rotate-90 shrink-0">
               <HippieSmallFlower 
                 color={colors[bandIdx % colors.length]} 
                 centerColor="white" 
                 className="w-12 h-12 md:w-16 md:h-16"
               />
            </div>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black drop-shadow-[3px_3px_0px_#FFD700]">
              {band}
            </h2>
          </div>
          
          <div className="space-y-4 px-2">
            {songs.map((song) => (
              <button
                key={song.id}
                onClick={() => onSelectSong(song.id)}
                className={`w-full text-left p-5 md:p-6 rounded-[30px] md:rounded-[40px] transition-all border-4 border-black group relative overflow-hidden
                  ${selectedSongId === song.id 
                    ? 'bg-black text-white shadow-[10px_10px_0px_#FF69B4] -translate-y-2' 
                    : 'bg-white text-black hover:shadow-[8px_8px_0px_#000] hover:-translate-y-1 shadow-none active:translate-y-1 active:shadow-none'}`}
              >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] duration-1000`} />
                
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex-1 pr-4">
                    {/* Song Title - Smaller than band header, band name removed from underneath */}
                    <span className="block font-black text-xl md:text-2xl uppercase tracking-tight leading-tight transition-all">
                      {song.title}
                    </span>
                  </div>
                  <div className={`h-10 w-10 md:h-12 md:w-12 rounded-full border-4 border-black flex items-center justify-center transition-all duration-300 transform shrink-0
                    ${selectedSongId === song.id ? 'bg-white text-black rotate-90 scale-110' : 'bg-black text-white group-hover:rotate-45'}`}>
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SongList;
