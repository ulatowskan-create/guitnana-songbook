
export interface Song {
  id: string;
  band: string;
  title: string;
  content: string; // Chords/Tabs
  youtubeUrl: string;
  embedUrl: string; // New field for specific embed links
  rawIndex: number;
}

export enum ViewMode {
  LIST = 'LIST',
  DETAIL = 'DETAIL'
}

export interface AppState {
  songs: Song[];
  loading: boolean;
  error: string | null;
  selectedSongId: string | null;
  searchQuery: string;
}
