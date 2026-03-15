// SportsRadar NCAAMB API client
// SPORTSRADAR_BASE_URL is swappable — will be replaced by custom scraper when ready

const BASE_URL = process.env.SPORTSRADAR_BASE_URL;
const API_KEY = process.env.SPORTSRADAR_API_KEY;

export async function getTournamentSchedule(year: number) {
  const res = await fetch(
    `${BASE_URL}/tournaments/${year}/schedule.json?api_key=${API_KEY}`
  );
  if (!res.ok) throw new Error(`SportsRadar API error: ${res.status}`);
  return res.json();
}

export async function getGameSummary(gameId: string) {
  const res = await fetch(
    `${BASE_URL}/games/${gameId}/summary.json?api_key=${API_KEY}`
  );
  if (!res.ok) throw new Error(`SportsRadar API error: ${res.status}`);
  return res.json();
}

export async function getTeamRoster(teamId: string) {
  const res = await fetch(
    `${BASE_URL}/teams/${teamId}/profile.json?api_key=${API_KEY}`
  );
  if (!res.ok) throw new Error(`SportsRadar API error: ${res.status}`);
  return res.json();
}
