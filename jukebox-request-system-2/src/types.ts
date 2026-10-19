export type SongGenre = 'Nigerian' | 'International' | 'Reggae' | 'Gospel';
export type GenreFilter = 'All' | SongGenre;

export interface Song {
  id: string;
  trackNumber: number;
  title: string;
  artist: string;
  duration: string;
  genre?: SongGenre;
  addedAt?: number;
  badgeColor?: {
    bg: string;
    text: string;
    border: string;
    titleColor: string;
  };
}

export interface QueueItem {
  queueId: string;
  song: Song;
  requestedBy: string;
  note?: string;
  status: 'playing' | 'next' | 'queued' | 'played' | 'completed';
  requestedAt: string;
  timestamp?: number;
  score?: number;      // 1 to 100 percentage
  scoredAt?: number;   // Timestamp when score was assigned
}

export type PatronTab = 'catalog' | 'queue';
export type ViewMode = 'patron' | 'host';

export interface Comment {
  id: string;
  author: string;
  message: string;
  tag: string;
  timestamp: string;
}

export interface HostConfig {
  pin?: string;
  venueName?: string;
  showLeaderboard?: boolean;
  updatedAt?: number;
}
