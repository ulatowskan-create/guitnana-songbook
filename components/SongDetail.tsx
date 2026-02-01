
import React, { useState, useEffect } from 'react';
import { Song } from '../types';
import { getSongInsight, getChordsAndLyrics } from '../services/geminiService';

interface SongDetailProps {
  song: Song;
  onBack: () => void;
}

const HippieFlower = ({ color, centerColor = "white", className = "w-12 h-12" }: { color: string, centerColor?: string, className?: string }) => (
  <svg className={`flower-sway ${className}`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="25" r="20" fill={color} stroke="black" strokeWidth="6" />
    <circle cx="75" cy="42" r="20" fill={color} stroke="black" strokeWidth="6" />
    <circle cx="65" cy="72" r="20" fill={color} stroke="black" strokeWidth="6" />
    <circle cx="35" cy="72" r="20" fill={color} stroke="black" strokeWidth="6" />
    <circle cx="25" cy="42" r="20" fill={color} stroke="black" strokeWidth="6" />
    <circle cx="50" cy="50" r="15" fill={centerColor} stroke="black" strokeWidth="6" />
    <circle cx="50" cy="50" r="6" fill="black" />
  </svg>
);

const ChordRenderer: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  
  return (
    <div className="chords-font space-y-3 select-none">
      {lines.map((line, lineIdx) => {
        const hasChords = line.includes('[') && line.includes(']');
        
        if (line.trim().startsWith('[') && line.trim().endsWith(']') && !line.trim().slice(1,-1).includes(' ')) {
           return (
             <div key={lineIdx} className="font-black text-[9px] md:text-[11px] uppercase tracking-[0.4em] text-black/30 mt-6 mb-1">
               {line}
             </div>
           );
        }

        if (!hasChords) {
          if (line.trim() === '') return <div key={lineIdx} className="h-3"></div>;
          return <div key={lineIdx} className="text-black/80 text-[10px] md:text-[12px] whitespace-pre leading-tight">{line}</div>;
        }

        let cleanText = "";
        const chordsInLine: { pos: number, name: string }[] = [];
        const regex = /\[([^\]]+)\]/g;
        let match;
        let lastIndex = 0;

        while ((match = regex.exec(line)) !== null) {
          cleanText += line.substring(lastIndex, match.index);
          chordsInLine.push({ pos: cleanText.length, name: match[1] });
          lastIndex = regex.lastIndex;
        }
        cleanText += line.substring(lastIndex);

        let chordsLineStr = "";
        chordsInLine.forEach(c => {
          while (chordsLineStr.length < c.pos) chordsLineStr += " ";
          chordsLineStr += c.name;
        });

        return (
          <div key={lineIdx} className="flex flex-col leading-none">
            <div className="text-black font-black text-[10px] md:text-[12px] whitespace-pre min-h-[1rem]">
              {chordsLineStr}
            </div>
            <div className="text-black/70 text-[10px] md:text-[12px] whitespace-pre pb-1">
              {cleanText}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const SongDetail: React.FC<SongDetailProps> = ({ song, onBack }) => {
  const [insightLines, setInsightLines] = useState<string[]>([]);
  const [chordsText, setChordsText] = useState<string | null>(null);
  const [loading, setLoading] = useState({ insight: false, chords: false });
  const [showIframe, setShowIframe] = useState(true);

  const isUrl = (str: string) => {
    if (!str) return false;
    try { 
      const trimmed = str.trim();
      return (trimmed.startsWith('http://') || trimmed.startsWith('https://'));
    } catch { return false; }
  };

  const youtubeLink = song.youtubeUrl?.trim();
  const tabsLink = isUrl(song.content) ? song.content.trim() : null;
  const sourceLink = isUrl(song.embedUrl) ? song.embedUrl.trim() : null;

  useEffect(() => {
    const fetchData = async () => {
      setLoading({ insight: true, chords: true });
      const insightPromise = getSongInsight(song.band, song.title, song.content);
      const chordsPromise = getChordsAndLyrics(song.band, song.title, song.embedUrl || song.youtubeUrl);
      const [insightResult, chordsResult] = await Promise.all([insightPromise, chordsPromise]);
      setInsightLines(insightResult ? insightResult.split('\n').filter(l => l.trim().length > 0) : []);
      setChordsText(chordsResult);
      setLoading({ insight: false, chords: false });
    };
    fetchData();
  }, [song.id]);

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      <button 
        onClick={onBack} 
        className="fixed top-8 left-8 z-50 pop-button h-12 w-12 md:h-14 md:w-14 rounded-full flex items-center justify-center bg-white hover:bg-black hover:text-white transition-all shadow-[6px_6px_0px_#000]"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-12 space-y-16 custom-scrollbar scroll-smooth">
        <div className="text-center space-y-2 mt-8 md:mt-0 animate-fade-in">
          <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-black uppercase leading-tight px-4 drop-shadow-[2px_2px_0px_#FF1493]">
            {song.title}
          </h1>
          <p className="text-lg md:text-xl font-bold text-black/40 tracking-[0.4em] uppercase italic">
            {song.band}
          </p>
        </div>

        {/* YouTube Embed */}
        <div className="w-full max-w-4xl mx-auto animate-fade-in">
          <div className="aspect-video rounded-[40px] md:rounded-[60px] border-[6px] md:border-[10px] border-black bg-[#111] shadow-[15px_15px_0px_#000] overflow-hidden relative">
             {youtubeLink && showIframe ? (
               <iframe
                 className="absolute inset-0 w-full h-full"
                 src={`https://www.youtube.com/embed/${youtubeLink.includes('watch?v=') ? youtubeLink.split('watch?v=')[1]?.split('&')[0] : youtubeLink.split('/').pop()}`}
                 title={`${song.band} - ${song.title}`}
                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                 referrerPolicy="strict-origin-when-cross-origin"
                 allowFullScreen
                 style={{ border: 'none' }}
                 onError={() => setShowIframe(false)}
               />
             ) : youtubeLink ? (
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="absolute inset-0 opacity-20 pointer-events-none flex flex-wrap gap-12 p-8 justify-center items-center overflow-hidden">
                   {[...Array(6)].map((_, i) => (
                     <HippieFlower key={i} color={["#FF0000", "#FFD700", "#FF69B4"][i % 3]} className="w-32 h-32" />
                   ))}
                 </div>
                 <a 
                   href={youtubeLink} 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="pop-button relative z-10 bg-[#FF0000] text-white px-8 md:px-12 py-5 md:py-8 rounded-full font-black text-xl md:text-3xl uppercase tracking-widest flex items-center gap-4 hover:scale-105 active:scale-95 transition-all shadow-[10px_10px_0px_#000]"
                 >
                   <svg className="w-8 h-8 md:w-12 md:h-12" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                   </svg>
                   View on YouTube
                 </a>
               </div>
             ) : (
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="text-white font-black uppercase tracking-widest text-center px-4">
                   YouTube Link Not Available
                 </div>
               </div>
             )}
          </div>
        </div>

        <div className="max-w-4xl mx-auto bg-white border-8 border-black rounded-[30px] shadow-[15px_15px_0px_#000] overflow-hidden animate-fade-in">
          <div className="bg-white border-b-4 border-black p-5">
            <h2 className="text-xs md:text-sm font-black uppercase tracking-[0.4em] text-black">Tekst & chords</h2>
          </div>
          <div className="p-6 md:p-12 bg-white overflow-x-auto min-h-[300px]">
            {loading.chords ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-3 bg-black/5 rounded-full w-full"></div>
                ))}
              </div>
            ) : chordsText ? (
              <ChordRenderer text={chordsText} />
            ) : (
              <div className="text-center py-20 text-black/20 font-black uppercase tracking-widest text-[10px]">
                Nie znaleziono tekstu utworu
              </div>
            )}
          </div>
        </div>

        <div className="max-w-3xl mx-auto p-10 border-8 border-black rounded-[50px] bg-[#FFF8E7] relative shadow-[15px_15px_0px_#32CD32] animate-fade-in">
          <div className="absolute -top-10 -right-6 transform rotate-12">
            <HippieFlower color="#FF69B4" className="w-20 h-20" />
          </div>
          <h3 className="text-[15px] font-black uppercase tracking-[0.5em] mb-8 text-black/50">Pro tipy dla Nany</h3>
          <div className="space-y-6">
            {loading.insight ? (
              <div className="space-y-4 animate-pulse"><div className="h-4 bg-black/5 rounded-full w-full"></div></div>
            ) : (
              insightLines.map((line, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <span className="text-2xl font-black text-[#FF1493]">✦</span>
                  <p className="text-lg md:text-xl font-black leading-relaxed text-black/80 tracking-tight">{line}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="max-w-xs mx-auto flex flex-col gap-4 animate-fade-in pb-24">
          {tabsLink && (
            <a href={tabsLink} target="_blank" rel="noopener noreferrer" className="pop-button w-full bg-[#32CD32] text-white px-6 py-4 rounded-full font-black text-lg uppercase tracking-widest text-center shadow-[6px_6px_0px_#000]">
              🎸 Taby
            </a>
          )}
          {sourceLink && (
            <a href={sourceLink} target="_blank" rel="noopener noreferrer" className="pop-button w-full bg-[#FFD700] text-black px-6 py-4 rounded-full font-black text-lg uppercase tracking-widest text-center shadow-[6px_6px_0px_#000]">
              🔗 Inne źródło
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default SongDetail;
