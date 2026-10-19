import { Song } from '../types';

/**
 * Normalizes a text string for searching:
 * - Strips diacritics/accents (e.g., é -> e, ñ -> n)
 * - Lowercases all characters
 * - Normalizes featuring variations ('featuring', 'feat.', 'ft.') to 'ft'
 * - Strips apostrophes (e.g., "don't" -> "dont")
 * - Converts non-alphanumeric characters to spaces
 * - Collapses consecutive spaces
 */
export function normalizeSearchText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(feat|featuring|ft)\.?\b/g, 'ft')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts searchable query tokens from a user query string.
 */
export function extractSearchTokens(query: string): string[] {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];
  return normalized.split(' ').filter((token) => token.length > 0);
}

/**
 * Interface representing a prepared searchable song with pre-computed normalized fields
 * for high-speed synchronous evaluation.
 */
export interface PreparedSearchableSong {
  song: Song;
  normTitle: string;
  normArtist: string;
  combinedText1: string; // "title artist"
  combinedText2: string; // "artist title"
  titleWords: string[];
  artistWords: string[];
}

/**
 * Prepares a song for fast repeated search operations.
 */
export function prepareSearchableSong(song: Song): PreparedSearchableSong {
  const normTitle = normalizeSearchText(song.title || '');
  const normArtist = normalizeSearchText(song.artist || '');
  const normGenre = normalizeSearchText(song.genre || '');
  const combined = normGenre ? `${normTitle} ${normArtist} ${normGenre}` : `${normTitle} ${normArtist}`;
  const combinedRev = normGenre ? `${normArtist} ${normTitle} ${normGenre}` : `${normArtist} ${normTitle}`;
  return {
    song,
    normTitle,
    normArtist,
    combinedText1: combined,
    combinedText2: combinedRev,
    titleWords: normTitle ? normTitle.split(' ') : [],
    artistWords: normArtist ? normArtist.split(' ') : [],
  };
}

/**
 * Verifies if all query tokens are present across title and artist in any order.
 */
export function songMatchesAllTokens(
  item: PreparedSearchableSong,
  tokens: string[]
): boolean {
  if (tokens.length === 0) return true;

  const combined = item.combinedText1;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!combined.includes(token)) {
      return false;
    }
  }
  return true;
}

/**
 * Computes a relevance score for a song against a user query and its tokens.
 * Higher score = higher ranking.
 *
 * Scoring Priorities:
 * 1. Exact Title match (+2000)
 * 2. Exact Title + Artist match (+1500)
 * 3. Exact Artist match (+1200)
 * 4. Title starts with full query (+800)
 * 5. Artist starts with full query (+500)
 * 6. Title contains full query as substring (+400)
 * 7. Artist contains full query as substring (+250)
 * 8. All tokens found in Title (+300) or Artist (+150)
 * 9. Word boundary prefix matches (+60 for title, +40 for artist)
 * 10. Word exact matches (+100 for title, +60 for artist)
 * 11. Substring token matches (+40 for title, +20 for artist)
 * 12. Relative token order bonus (+80)
 * 13. Brevity penalty (-0.05 * excess character length)
 */
export function calculateRelevanceScore(
  item: PreparedSearchableSong,
  normalizedQuery: string,
  tokens: string[]
): number {
  if (tokens.length === 0) return 0;

  const { normTitle, normArtist, combinedText1, combinedText2, titleWords, artistWords } = item;
  let score = 0;

  // 1. Exact Full Query Matches
  if (normTitle === normalizedQuery) {
    score += 2000;
  } else if (normArtist === normalizedQuery) {
    score += 1200;
  } else if (combinedText1 === normalizedQuery || combinedText2 === normalizedQuery) {
    score += 1500;
  }

  // 2. Full Query Prefix Matches
  if (normTitle.startsWith(normalizedQuery)) {
    score += 800;
  } else if (normArtist.startsWith(normalizedQuery)) {
    score += 500;
  }

  // 3. Full Query Substring Matches
  if (normTitle.includes(normalizedQuery)) {
    score += 400;
  } else if (normArtist.includes(normalizedQuery)) {
    score += 250;
  }

  // 4. Token-Level Matching
  let allTokensInTitle = true;
  let allTokensInArtist = true;
  let lastIndexInCombined = -1;
  let preservedOrder = true;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // Check title matches
    const inTitleExactWord = titleWords.includes(token);
    const inTitleWordPrefix = !inTitleExactWord && titleWords.some((w) => w.startsWith(token));
    const inTitleSubstring = !inTitleExactWord && !inTitleWordPrefix && normTitle.includes(token);

    if (inTitleExactWord) {
      score += 100;
    } else if (inTitleWordPrefix) {
      score += 60;
    } else if (inTitleSubstring) {
      score += 40;
    } else {
      allTokensInTitle = false;
    }

    // Check artist matches
    const inArtistExactWord = artistWords.includes(token);
    const inArtistWordPrefix = !inArtistExactWord && artistWords.some((w) => w.startsWith(token));
    const inArtistSubstring = !inArtistExactWord && !inArtistWordPrefix && normArtist.includes(token);

    if (inArtistExactWord) {
      score += 60;
    } else if (inArtistWordPrefix) {
      score += 40;
    } else if (inArtistSubstring) {
      score += 20;
    } else {
      allTokensInArtist = false;
    }

    // Check sequential token order in combined text
    const idx = combinedText1.indexOf(token);
    if (idx !== -1) {
      if (idx < lastIndexInCombined) {
        preservedOrder = false;
      }
      lastIndexInCombined = idx;
    }
  }

  if (allTokensInTitle) {
    score += 300;
  }
  if (allTokensInArtist) {
    score += 150;
  }
  if (preservedOrder && tokens.length > 1) {
    score += 80;
  }

  // Brevity penalty: preference for concise, exact titles over long rambling text
  const totalLength = normTitle.length + normArtist.length;
  score -= totalLength * 0.05;

  return score;
}

/**
 * High-performance search and ranking engine.
 * - If searchQuery is empty or whitespace: returns songs sorted alphabetically (A-Z) by artist, then title.
 * - If searchQuery is active: returns songs matching all query tokens in any order, sorted by relevance score descending.
 */
export function filterAndRankSongs(songs: Song[], searchQuery: string): Song[] {
  if (!searchQuery || !searchQuery.trim()) {
    return [...songs].sort((a, b) => {
      const artistCompare = (a.artist || '').localeCompare(b.artist || '', undefined, {
        sensitivity: 'base',
        numeric: true,
      });
      if (artistCompare !== 0) return artistCompare;
      return (a.title || '').localeCompare(b.title || '', undefined, {
        sensitivity: 'base',
        numeric: true,
      });
    });
  }

  const normalizedQuery = normalizeSearchText(searchQuery);
  const tokens = extractSearchTokens(searchQuery);

  if (tokens.length === 0) {
    return [...songs];
  }

  const matches: { song: Song; score: number }[] = [];

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    const prepared = prepareSearchableSong(song);

    if (songMatchesAllTokens(prepared, tokens)) {
      const score = calculateRelevanceScore(prepared, normalizedQuery, tokens);
      matches.push({ song, score });
    }
  }

  // Sort descending by relevance score, tie-breaking by title then artist
  matches.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const titleCompare = (a.song.title || '').localeCompare(b.song.title || '', undefined, {
      sensitivity: 'base',
      numeric: true,
    });
    if (titleCompare !== 0) return titleCompare;
    return (a.song.artist || '').localeCompare(b.song.artist || '', undefined, {
      sensitivity: 'base',
      numeric: true,
    });
  });

  return matches.map((m) => m.song);
}
