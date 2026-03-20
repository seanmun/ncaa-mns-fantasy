import { neon } from '@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_iC1pkSLNamf6@ep-summer-cake-adecx91b-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';
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
