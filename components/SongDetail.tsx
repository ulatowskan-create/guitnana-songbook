
import React, { useEffect, useState, useRef } from 'react';
import { Song, AppState } from '../types';
import { getSongInsight, getChordsAndLyrics } from '../services/geminiService';

interface SongDetailProps {
  song: Song;
  onBack: () => void;
}

export const SongDetail: React.FC<SongDetailProps> = ({ song, onBack }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [chordsText, setChordsText] = useState<string | null>(null);
  const [loading, setLoading] = useState({ insight: true, chords: true });
  const [isAutoScroll, setIsAutoScroll] = useState(false);

  // Extract YouTube ID
  let youtubeId = null;
  if (song.youtubeUrl) {
    const match = song.youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/.*v=)([^&]+)/);
    youtubeId = match ? match[1] : null;
  }

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
    const isContentUrl = isUrl(song.content);

    // MANUAL ENTRY MODE: If content is provided and NOT a URL, treat as raw tabs
    if (song.content && !isContentUrl) {
      console.log("Manual content detected (not a URL), using direct text.");
      setChordsText(song.content);
      setLoading(prev => ({ ...prev, chords: false }));
      return;
    }

    // AUTOMATED FETCH MODE: Try Songsterr -> UG -> AI
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

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pb-32">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Header Card */}
          <div className="pop-card p-6 bg-[#FFDEE9] bg-gradient-to-r from-[#FFDEE9] to-[#B5FFFC]">
            <h2 className="text-3xl font-black mb-1 uppercase tracking-tighter">{song.title}</h2>
            <h3 className="text-xl font-bold bg-white inline-block px-2 py-1 transform -rotate-2 border-2 border-black">{song.band}</h3>

            {/* Manual Mode Indicator */}
            {song.content && !isUrl(song.content) && (
              <div className="mt-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                • Tryb Manualny (Tekst z Arkusza)
              </div>
            )}
          </div>

          {/* YouTube Embed */}
          {youtubeId && (
            <div className="pop-card p-2 bg-black">
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

          {/* AI Insight */}
          <div className="pop-card p-5 bg-[#FFE259] bg-gradient-to-r from-[#FFE259] to-[#FFA751]">
            <h4 className="font-black text-lg mb-3 flex items-center gap-2">
              <span className="text-2xl">💡</span>
              NANA RADZI:
            </h4>
            {loading.insight ? (
              <div className="animate-pulse flex space-y-2 flex-col">
                <div className="h-4 bg-black/10 rounded w-3/4"></div>
                <div className="h-4 bg-black/10 rounded w-1/2"></div>
              </div>
            ) : (
              <div className="font-medium whitespace-pre-line leading-relaxed">
                {insight}
              </div>
            )}
          </div>

          {/* Chords & Lyrics */}
          <div className="pop-card p-6 bg-white relative min-h-[400px]">
            {/* Decor */}
            <div className="absolute -top-3 -right-3 w-12 h-12 bg-[#FF0080] rounded-full border-4 border-black z-10 flex items-center justify-center text-white font-bold text-lg transform rotate-12">
              ♫
            </div>

            <div className="flex justify-between items-center mb-6 border-b-4 border-black pb-2">
              <h4 className="font-black text-2xl uppercase">Tekst & Chwyty</h4>
              <button
                onClick={toggleAutoScroll}
                className={`pop-button px-4 py-1 text-sm font-bold flex items-center gap-2 ${isAutoScroll ? 'bg-green-400' : 'bg-gray-200'}`}
              >
                {isAutoScroll ? '⏹ STOP' : '▶ AUTO-SCROLL'}
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
    <div className="chords-font space-y-3 select-none text-[13px] md:text-[15px] overflow-x-auto pb-4">
      {lines.map((line, lineIdx) => {
        // [Header] detection
        const headerMatch = line.trim().match(/^\[(.*?)\]$/);
        if (headerMatch && !line.includes(' ')) {
          // Probably a section header like [Verse] or [Chorus] if it's the only thing on the line
          // But be careful not to catch [Am]
          // usually headers have letters, often Verse 1 etc.
          // Let's rely on standard length heuristic or keywords
          // Or just simply: if it matches [Text] and Text is NOT a chord...
          // Too complex for now, simplistic heuristic:
          if (line.length > 5 && !/^[A-G]/.test(headerMatch[1])) {
            return (
              <div key={lineIdx} className="font-black text-lg mt-6 mb-2 border-l-4 border-[#FF0080] pl-2 text-[#FF0080]">
                {line.replace(/[\[\]]/g, '')}
              </div>
            );
          }
        }

        // Detect Tablature line (contains |--- or similar)
        const isTab = /\|-+\|/.test(line) || /e\|/.test(line) || /B\|/.test(line) || /-+\d+-+/.test(line);

        if (isTab) {
          // Render tab lines in strict monospace, preserving all spaces
          return (
            <div key={lineIdx} className="font-mono whitespace-pre text-gray-800 leading-none tracking-tighter">
              {line}
            </div>
          );
        }

        const hasChords = /\[.*?\]/.test(line);
        if (!hasChords) {
          if (line.trim() === '') return <div key={lineIdx} className="h-3"></div>;
          return <div key={lineIdx} className="text-black/80 whitespace-pre leading-tight">{line}</div>;
        }

        const parts = line.split(/(\[.*?\])/);
        return (
          <div key={lineIdx} className="flex flex-wrap items-baseline leading-loose">
            {parts.map((part, partIdx) => {
              if (part.startsWith('[') && part.endsWith(']')) {
                const chord = part.slice(1, -1);
                return (
                  <span key={partIdx} className="text-[#FF0080] font-black mx-1 cursor-pointer hover:scale-110 inline-block transition-transform">
                    {chord}
                  </span>
                );
              }
              return <span key={partIdx}>{part}</span>;
            })}
          </div>
        );
      })}
    </div>
  );
};
