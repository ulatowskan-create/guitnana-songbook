
import React, { useEffect, useState } from 'react';
import { Song } from '../types';
import { getSongInsight, getChordsAndLyrics } from '../services/geminiService';
import { extractYoutubeId } from '../services/csvService';

interface SongDetailProps {
  song: Song;
  onBack: () => void;
}

// Reusing the Flower Icon for consistency
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

export const SongDetail: React.FC<SongDetailProps> = ({ song, onBack }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [chordsText, setChordsText] = useState<string | null>(null);
  const [loading, setLoading] = useState({ insight: true, chords: true });
  const [isAutoScroll, setIsAutoScroll] = useState(false);

  // Extract YouTube ID using robust helper
  const youtubeId = extractYoutubeId(song.youtubeUrl);

  // Auto-scroll logic
  useEffect(() => {
    let scrollInterval: NodeJS.Timeout;
    if (isAutoScroll) {
      scrollInterval = setInterval(() => {
        const scroller = document.querySelector('.custom-scrollbar');
        if (scroller) {
          scroller.scrollTop += 1;
        }
      }, 50);
    }
    return () => clearInterval(scrollInterval);
  }, [isAutoScroll]);

  // Data Fetching
  useEffect(() => {
    // Reset state
    setInsight(null);
    setChordsText(null);
    setLoading({ insight: true, chords: true });

    // 1. Get Insights
    getSongInsight(song.band, song.title, song.content)
      .then(text => {
        setInsight(text);
        setLoading(prev => ({ ...prev, insight: false }));
      });

    // 2. Get Chords/Lyrics logic

    // PRIORITY 0: Explicit Manual Column (Column F "Tekst+chords")
    if (song.manualChords && song.manualChords.trim().length > 0) {
      console.log("Using explicit manual chords from column F");
      setChordsText(song.manualChords);
      setLoading(prev => ({ ...prev, chords: false }));
      return;
    }

    const isContentUrl = isUrl(song.content);

    // PRIORITY 1: Manual content in old column (Column D not URL)
    if (song.content && !isContentUrl) {
      console.log("Manual content detected in Col D, using direct text.");
      setChordsText(song.content);
      setLoading(prev => ({ ...prev, chords: false }));
      return;
    }

    // PRIORITY 2: AUTOMATED FETCH MODE (Songsterr -> UG -> AI)
    const sourceUrl = isContentUrl ? song.content.trim() : '';

    getChordsAndLyrics(song.band, song.title, sourceUrl)
      .then(result => { // result can be string or null
        if (result) {
          setChordsText(result);
        } else {
          setChordsText("Nie udało się pobrać tekstu. Spróbuj odświeżyć.");
        }
        setLoading(prev => ({ ...prev, chords: false }));
      });

  }, [song]);

  const toggleAutoScroll = () => {
    setIsAutoScroll(!isAutoScroll);
  };

  const colors = ["#FF4500", "#FF69B4", "#32CD32", "#1E90FF", "#FFD700", "#9370DB"];
  // Pick a randomish color based on song length
  const accentColor = colors[song.title.length % colors.length];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pb-32">
        <div className="max-w-3xl mx-auto space-y-8">

          {/* Back Button */}
          <button
            onClick={onBack}
            className="group flex items-center gap-3 text-xl font-black uppercase tracking-tight hover:-translate-x-2 transition-transform"
          >
            <div className="h-12 w-12 rounded-full border-4 border-black bg-white flex items-center justify-center shadow-[4px_4px_0px_#000] group-hover:shadow-[2px_2px_0px_#000] transition-all">
              <span className="transform rotate-180">➜</span>
            </div>
            Wróć do listy
          </button>

          {/* Header Card - Matching SongList style */}
          <div className="rounded-[40px] border-4 border-black p-8 bg-[#FFDEE9] relative overflow-hidden shadow-[10px_10px_0px_#FF69B4]">
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="shrink-0 animate-spin-slow">
                <HippieSmallFlower color={accentColor} className="w-16 h-16 md:w-20 md:h-20" />
              </div>
              <div>
                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black leading-[0.9] mb-2 drop-shadow-[2px_2px_0px_#FFF]">
                  {song.title}
                </h2>
                <div className="inline-block bg-white border-2 border-black px-4 py-1 transform -rotate-2 shadow-[4px_4px_0px_#000]">
                  <h3 className="text-xl font-bold uppercase tracking-widest">{song.band}</h3>
                </div>
              </div>
            </div>

            {/* Background Decor */}
            <div className="absolute -right-10 -bottom-10 opacity-20">
              <HippieSmallFlower color="#FFF" className="w-64 h-64" />
            </div>
          </div>

          {/* YouTube Embed */}
          {youtubeId && (
            <div className="rounded-[30px] border-4 border-black p-0 bg-black overflow-hidden shadow-[8px_8px_0px_#000]">
              <div className="aspect-video w-full bg-gray-900">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          )}

          {/* Nana Radzi (Tips) */}
          <div className="rounded-[30px] border-4 border-black p-6 bg-[#FFE259] shadow-[8px_8px_0px_#000] relative">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">💡</span>
              <h4 className="font-black text-2xl uppercase">Nana Radzi</h4>
            </div>

            {loading.insight ? (
              <div className="animate-pulse flex space-y-3 flex-col">
                <div className="h-4 bg-black/10 rounded w-3/4"></div>
                <div className="h-4 bg-black/10 rounded w-1/2"></div>
              </div>
            ) : (
              <div className="font-medium whitespace-pre-line leading-relaxed text-lg">
                {insight}
              </div>
            )}
          </div>

          {/* Chords & Lyrics */}
          <div className="rounded-[30px] border-4 border-black p-6 md:p-8 bg-white shadow-[8px_8px_0px_#000] min-h-[500px] relative">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b-4 border-black pb-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-[#FF0080] text-white w-10 h-10 rounded-full border-2 border-black flex items-center justify-center font-bold">♫</div>
                <h4 className="font-black text-3xl uppercase tracking-tight">Tekst & Chwyty</h4>
              </div>

              <button
                onClick={toggleAutoScroll}
                className={`px-6 py-2 rounded-full border-2 border-black font-bold uppercase tracking-wider text-sm transition-all shadow-[4px_4px_0px_#000] hover:translate-y-1 hover:shadow-none
                     ${isAutoScroll ? 'bg-green-400 text-black' : 'bg-gray-100 text-gray-500 hover:bg-white hover:text-black'}`}
              >
                {isAutoScroll ? '⏹ Stop Scroll' : '▶ Auto Scroll'}
              </button>
            </div>

            {loading.chords ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
                ))}
              </div>
            ) : (
              <ChordRenderer text={chordsText || "Brak tekstu."} />
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

// Simple URL check
const isUrl = (string: string) => {
  if (!string) return false;
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

const ChordRenderer: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');

  return (
    <div className="chords-font space-y-3 select-none text-[14px] md:text-[16px] overflow-x-auto pb-10">
      {lines.map((line, lineIdx) => {
        // [Header] detection
        const headerMatch = line.trim().match(/^\[(.*?)\]$/);
        if (headerMatch && !line.includes(' ')) {
          if (line.length > 5 && !/^[A-G]/.test(headerMatch[1])) {
            return (
              <div key={lineIdx} className="font-black text-xl mt-8 mb-4 inline-block bg-[#FF0080] text-white px-3 py-1 transform -rotate-1 border-2 border-black shadow-[3px_3px_0px_#000]">
                {line.replace(/[\[\]]/g, '')}
              </div>
            );
          }
        }

        // Detect Tablature line
        const isTab = /\|-+\|/.test(line) || /e\|/.test(line) || /B\|/.test(line) || /-+\d+-+/.test(line);

        if (isTab) {
          return (
            <div key={lineIdx} className="font-mono whitespace-pre text-gray-800 leading-none tracking-tighter text-xs md:text-sm">
              {line}
            </div>
          );
        }

        const hasChords = /\[.*?\]/.test(line);
        if (!hasChords) {
          if (line.trim() === '') return <div key={lineIdx} className="h-4"></div>;
          return <div key={lineIdx} className="text-black leading-tight font-medium">{line}</div>;
        }

        const parts = line.split(/(\[.*?\])/);
        return (
          <div key={lineIdx} className="flex flex-wrap items-baseline leading-[2.5] text-[14px] md:text-[16px]">
            {parts.map((part, partIdx) => {
              if (part.startsWith('[') && part.endsWith(']')) {
                const chord = part.slice(1, -1);
                return (
                  <span key={partIdx} className="text-[#FF0080] font-black -mt-6 mx-1 cursor-pointer hover:scale-110 inline-block transition-transform relative top-[-0.5em]">
                    {chord}
                  </span>
                );
              }
              return <span key={partIdx} className="font-medium">{part}</span>;
            })}
          </div>
        );
      })}
    </div>
  );
};
