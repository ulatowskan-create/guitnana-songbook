
import { Song } from '../types';

const SPREADSHEET_ID = '1-Cui0FrWkLV9qQXZkZKcGEJ26RlS8YJukkdv9lSF4_4';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv`;

export const fetchSongs = async (): Promise<Song[]> => {
  try {
    // Add cache buster to force fresh data from Google Sheets
    const response = await fetch(`${CSV_URL}&_t=${Date.now()}`);
    if (!response.ok) throw new Error('Failed to fetch sheet data');

    const text = await response.text();
    const rows = parseCSV(text);

    // Mapping: [0: Zespół, 1: Tytuł, 2: Link YT, 3: Taby/Chords, 4: Embed Script/Link, 5: Manual Chords (F), 6: Backup (G)]
    return rows.slice(1).map((row, index) => ({
      id: `${index}-${row[1]}`,
      band: row[0] || 'Nieznany Zespół',
      title: row[1] || 'Bez tytułu',
      youtubeUrl: row[2] || '',
      content: row[3] || '',
      embedUrl: row[4] || '',
      // Try Column F (5), if empty and user made a mistake, try G (6) just in case
      manualChords: (row[5] || row[6] || '').trim(),
      rawIndex: index
    })).filter(song => song.title !== 'Bez tytułu');
  } catch (error) {
    console.error('Error fetching songs:', error);
    throw error;
  }
};

function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(currentField);
        currentField = '';
      } else if (char === '\n' || char === '\r') {
        if (currentField || row.length > 0) {
          row.push(currentField);
          result.push(row);
          row = [];
          currentField = '';
        }
        if (char === '\r' && nextChar === '\n') i++;
      } else {
        currentField += char;
      }
    }
  }

  if (currentField || row.length > 0) {
    row.push(currentField);
    result.push(row);
  }

  // Normalize row length to ensure we can access index 5 or 6
  // Find max length (expected at least 7 columns for A-G)
  const maxCols = 7;
  return result.map(r => {
    while (r.length < maxCols) {
      r.push('');
    }
    return r;
  });
}

/**
 * Robust YouTube ID extractor following the user's provided logic patterns
 */
export const extractYoutubeId = (url: string | null | undefined): string | null => {
  if (!url) return null;
  const val = url.trim();

  // 1. Check for ?v= or &v= (as per user's normalizeYT suggestion)
  const vMatch = val.match(/[?&]v=([^&]+)/);
  if (vMatch && vMatch[1]) {
    return vMatch[1];
  }

  // 2. Check if it's already an embed URL and extract ID
  if (val.includes('/embed/')) {
    const embedIdMatch = val.match(/\/embed\/([^/?&" ]+)/);
    if (embedIdMatch && embedIdMatch[1]) return embedIdMatch[1];
  }

  // 3. Handle youtu.be/ID
  const shortMatch = val.match(/youtu\.be\/([^/?&" ]+)/);
  if (shortMatch && shortMatch[1]) return shortMatch[1];

  // 4. Handle /shorts/ID or /live/ID
  const genericMatch = val.match(/\/(?:shorts|live|v)\/([^/?&" ]+)/);
  if (genericMatch && genericMatch[1]) return genericMatch[1];

  // 5. If the input is just the 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(val)) {
    return val;
  }

  return null;
};
