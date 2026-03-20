import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth, isAdmin } from '../_middleware.js';
import { getSportsRadarBaseUrl } from '../../src/lib/gameConfig.js';

/**
 * GET /api/stats/debug-boxscore?game_id=xxx&game_slug=ncaa-mens-2026
 *
 * Shows raw box score response from SportsRadar to debug why players aren't appearing
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await verifyAuth(req);
  if (!userId || !isAdmin(userId)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const API_KEY = process.env.SPORTSRADAR_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'SportsRadar API not configured' });
  }

  const gameId = req.query.game_id as string;
  const gameSlug = (req.query.game_slug as string) || 'ncaa-mens-2026';

  if (!gameId) {
    return res.status(400).json({ error: 'game_id query param required' });
  }

  try {
    const BASE_URL = getSportsRadarBaseUrl(gameSlug);
    const url = `${BASE_URL}/games/${gameId}/summary.json?api_key=${API_KEY}`;

    console.log(`Fetching box score from: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({
        error: `SportsRadar API error: ${response.status}`,
        url: url.replace(API_KEY, 'REDACTED'),
      });
    }

    const data = await response.json();

    // Return diagnostic info
    return res.status(200).json({
      data: {
        gameId,
        status: data.status,
        scheduled: data.scheduled,
        homeTeam: data.home?.name || 'unknown',
        awayTeam: data.away?.name || 'unknown',
        homeScore: data.home?.points || 0,
        awayScore: data.away?.points || 0,
        homePlayersCount: data.home?.players?.length || 0,
        awayPlayersCount: data.away?.players?.length || 0,
        // Show structure of first player (if exists)
        sampleHomePlayer: data.home?.players?.[0] || null,
        sampleAwayPlayer: data.away?.players?.[0] || null,
        // Show what keys exist on home/away objects
        homeKeys: data.home ? Object.keys(data.home) : [],
        awayKeys: data.away ? Object.keys(data.away) : [],
        // Full raw response (careful - could be large)
        rawResponse: data,
      },
    });
  } catch (err) {
    console.error('Debug box score error:', err);
    return res.status(500).json({ error: 'Failed to fetch box score' });
  }
}
