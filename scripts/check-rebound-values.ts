import { db, schema } from '../api/_db.js';
import { sql, eq, desc } from 'drizzle-orm';

const { playerTournamentStats, players, ncaaTeams } = schema;

async function checkRebounds() {
  console.log('🏀 Checking rebound values for anomalies...\n');

  // Get players with highest rebound counts in single games
  const highRebounds = await db
    .select({
      playerName: players.name,
      teamName: ncaaTeams.name,
      pts: playerTournamentStats.pts,
      reb: playerTournamentStats.reb,
      ast: playerTournamentStats.ast,
      round: playerTournamentStats.round,
      gameDate: playerTournamentStats.gameDate,
      gameId: playerTournamentStats.sportRadarGameId,
    })
    .from(playerTournamentStats)
    .innerJoin(players, eq(players.id, playerTournamentStats.playerId))
    .innerJoin(ncaaTeams, eq(ncaaTeams.id, players.teamId))
    .where(sql`${playerTournamentStats.reb} > 15`)
    .orderBy(desc(playerTournamentStats.reb))
    .limit(20);

  console.log('📊 Games with >15 rebounds (possible doubles if normally 8-12):');
  for (const record of highRebounds) {
    console.log(`   ${record.playerName} (${record.teamName}): ${record.pts}pts ${record.reb}reb ${record.ast}ast - ${record.round}`);
    console.log(`      Game: ${record.gameDate?.toISOString().split('T')[0]} (ID: ${record.gameId})`);
  }

  // Check if any player has multiple games on same date (might be duplicate)
  const sameDateGames = await db
    .select({
      playerId: playerTournamentStats.playerId,
      gameDate: sql<string>`DATE(${playerTournamentStats.gameDate})`.as('game_date'),
      count: sql<number>`COUNT(*)`.as('count'),
      totalReb: sql<number>`SUM(${playerTournamentStats.reb})`.as('total_reb'),
      gameIds: sql<string>`array_agg(${playerTournamentStats.sportRadarGameId})`.as('game_ids'),
    })
    .from(playerTournamentStats)
    .groupBy(playerTournamentStats.playerId, sql`DATE(${playerTournamentStats.gameDate})`)
    .having(sql`COUNT(*) > 1`);

  console.log(`\n\n🔍 Players with multiple stat records on same date: ${sameDateGames.length}`);
  if (sameDateGames.length > 0) {
    console.log('   (These might be duplicates with different game IDs)\n');
    for (const dup of sameDateGames.slice(0, 10)) {
      const [player] = await db
        .select({ name: players.name })
        .from(players)
        .where(eq(players.id, dup.playerId))
        .limit(1);

      console.log(`   ${player?.name || dup.playerId}:`);
      console.log(`      Date: ${dup.gameDate}`);
      console.log(`      Count: ${dup.count} records`);
      console.log(`      Total Reb: ${dup.totalReb}`);
      console.log(`      Game IDs: ${dup.gameIds}`);
      console.log('');
    }
  }

  // Average rebounds per game
  const avgStats = await db
    .select({
      avgPts: sql<number>`AVG(${playerTournamentStats.pts})`.as('avg_pts'),
      avgReb: sql<number>`AVG(${playerTournamentStats.reb})`.as('avg_reb'),
      avgAst: sql<number>`AVG(${playerTournamentStats.ast})`.as('avg_ast'),
    })
    .from(playerTournamentStats);

  console.log(`\n📈 Average stats per game record:`);
  console.log(`   Avg Points: ${avgStats[0]?.avgPts?.toFixed(2)}`);
  console.log(`   Avg Rebounds: ${avgStats[0]?.avgReb?.toFixed(2)}`);
  console.log(`   Avg Assists: ${avgStats[0]?.avgAst?.toFixed(2)}`);
  console.log(`\n   Expected NCAA averages: ~8-12pts, ~4-6reb, ~2-3ast per player`);
  console.log(`   If rebounds avg is ~8-12, it might be doubled!\n`);

  process.exit(0);
}

checkRebounds().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
