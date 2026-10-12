import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL; // never hard-code a connection string
if (!DATABASE_URL) throw new Error('DATABASE_URL is not set')
const sql = neon(DATABASE_URL);

console.log('Checking teams in database...\n');

const teams = await sql`
  SELECT
    t.name,
    t.sportsradar_team_id,
    COUNT(p.id) as player_count
  FROM ncaa_teams t
  LEFT JOIN players p ON t.id = p.team_id AND p.game_slug = 'ncaa-mens-2026'
  WHERE t.game_slug = 'ncaa-mens-2026'
  GROUP BY t.id, t.name, t.sportsradar_team_id
  ORDER BY t.name
  LIMIT 30
`;

console.log('Teams in database:');
console.log(JSON.stringify(teams, null, 2));

const totalPlayers = await sql`
  SELECT COUNT(*) as count
  FROM players
  WHERE game_slug = 'ncaa-mens-2026'
`;

console.log('\nTotal players:', totalPlayers[0].count);
