import { db, schema } from '../api/_db.js';
import { eq, sql } from 'drizzle-orm';

const { players, ncaaTeams, playerTournamentStats } = schema;

async function diagnose() {
  console.log('=== DATABASE DIAGNOSTIC ===\n');

  // 1. Check teams
  const teams = await db
    .select({
      id: ncaaTeams.id,
      name: ncaaTeams.name,
      srId: ncaaTeams.sportRadarTeamId,
      gameSlug: ncaaTeams.gameSlug,
    })
    .from(ncaaTeams)
    .where(eq(ncaaTeams.gameSlug, 'ncaa-mens-2026'))
    .limit(5);

  console.log(`TEAMS (first 5 of ${teams.length}):`);
  teams.forEach(t => console.log(`  ${t.name} - SR ID: ${t.srId || 'NULL'}`));

  // 2. Check total teams
  const [teamCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(ncaaTeams)
    .where(eq(ncaaTeams.gameSlug, 'ncaa-mens-2026'));

  console.log(`\nTOTAL TEAMS: ${teamCount.count}\n`);

  // 3. Check players
  const playerSample = await db
    .select({
      id: players.id,
      name: players.name,
      srId: players.sportRadarPlayerId,
      teamId: players.teamId,
    })
    .from(players)
    .where(eq(players.gameSlug, 'ncaa-mens-2026'))
    .limit(10);

  console.log(`PLAYERS (first 10):`);
  playerSample.forEach(p => console.log(`  ${p.name} - SR ID: ${p.srId || 'NULL'}`));

  // 4. Count players with/without SR IDs
  const [playerStats] = await db
    .select({
      total: sql<number>`COUNT(*)`,
      withSrId: sql<number>`COUNT(CASE WHEN ${players.sportRadarPlayerId} IS NOT NULL THEN 1 END)`,
      withoutSrId: sql<number>`COUNT(CASE WHEN ${players.sportRadarPlayerId} IS NULL THEN 1 END)`,
    })
    .from(players)
    .where(eq(players.gameSlug, 'ncaa-mens-2026'));

  console.log(`\nPLAYER STATS:`);
  console.log(`  Total: ${playerStats.total}`);
  console.log(`  With SR ID: ${playerStats.withSrId}`);
  console.log(`  WITHOUT SR ID: ${playerStats.withoutSrId}`);

  if (playerStats.withoutSrId > 0) {
    console.log(`\n❌ PROBLEM: ${playerStats.withoutSrId} players have NO SportsRadar ID!`);
    console.log(`   They will NEVER match during sync.`);
  }

  // 5. Check existing stats
  const [statsCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(playerTournamentStats);

  console.log(`\nEXISTING STATS RECORDS: ${statsCount.count}\n`);

  if (playerStats.withSrId === 0) {
    console.log('❌❌❌ CRITICAL: NO PLAYERS HAVE SPORTSRADAR IDs ❌❌❌');
    console.log('You need to import players from SportsRadar first!');
  }

  process.exit(0);
}

diagnose().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
