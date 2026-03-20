import { neon } from '@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_iC1pkSLNamf6@ep-summer-cake-adecx91b-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(DATABASE_URL);

console.log('Checking player data...\n');

const players = await sql`
  SELECT
    p.name,
    p.sportsradar_player_id,
    t.name as team_name,
    (SELECT COUNT(*) FROM player_tournament_stats WHERE player_id = p.id) as stat_count
  FROM players p
  LEFT JOIN ncaa_teams t ON p.team_id = t.id
  WHERE p.game_slug = 'ncaa-mens-2026'
    AND t.name IN ('Nebraska', 'Duke', 'Louisville', 'Wisconsin')
  LIMIT 20
`;

console.log('Sample players from teams in completed games:');
console.log(JSON.stringify(players, null, 2));

const nullCount = await sql`
  SELECT COUNT(*) as count
  FROM players p
  WHERE p.game_slug = 'ncaa-mens-2026'
    AND p.sportsradar_player_id IS NULL
`;

console.log('\nPlayers with NULL sportsradar_player_id:', nullCount[0].count);
