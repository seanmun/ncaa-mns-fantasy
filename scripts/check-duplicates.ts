import { db, schema } from '../api/_db.js';
import { sql, eq } from 'drizzle-orm';

const { playerTournamentStats, players } = schema;

async function checkDuplicates() {
  console.log('🔍 Checking for duplicate stat records...\n');

  // Find records where same player + game ID appears multiple times
  const duplicates = await db
    .select({
      playerId: playerTournamentStats.playerId,
      sportRadarGameId: playerTournamentStats.sportRadarGameId,
      count: sql<number>`COUNT(*)`.as('count'),
      totalReb: sql<number>`SUM(${playerTournamentStats.reb})`.as('total_reb'),
      records: sql<string>`array_agg(${playerTournamentStats.id})`.as('records'),
    })
    .from(playerTournamentStats)
    .groupBy(playerTournamentStats.playerId, playerTournamentStats.sportRadarGameId)
    .having(sql`COUNT(*) > 1`);

  if (duplicates.length === 0) {
    console.log('✅ No duplicates found based on playerId + sportRadarGameId');
  } else {
    console.log(`❌ Found ${duplicates.length} duplicate player-game combinations:\n`);
    for (const dup of duplicates.slice(0, 10)) {
      console.log(`   Player ID: ${dup.playerId}`);
      console.log(`   Game ID: ${dup.sportRadarGameId}`);
      console.log(`   Count: ${dup.count} records`);
      console.log(`   Total Rebounds: ${dup.totalReb}`);
      console.log(`   Record IDs: ${dup.records}`);
      console.log('');
    }
  }

  // Check for records with null gameId
  const nullGameIds = await db
    .select({
      count: sql<number>`COUNT(*)`.as('count'),
    })
    .from(playerTournamentStats)
    .where(sql`${playerTournamentStats.sportRadarGameId} IS NULL`);

  console.log(`\n📊 Records with NULL sportRadarGameId: ${nullGameIds[0]?.count || 0}`);

  // Get total stat records
  const totalStats = await db
    .select({
      count: sql<number>`COUNT(*)`.as('count'),
      totalReb: sql<number>`SUM(${playerTournamentStats.reb})`.as('total_reb'),
    })
    .from(playerTournamentStats);

  console.log(`\n📈 Total stat records: ${totalStats[0]?.count || 0}`);
  console.log(`📈 Total rebounds across all records: ${totalStats[0]?.totalReb || 0}`);

  // Sample some records to check values
  const samples = await db
    .select({
      id: playerTournamentStats.id,
      playerId: playerTournamentStats.playerId,
      pts: playerTournamentStats.pts,
      reb: playerTournamentStats.reb,
      ast: playerTournamentStats.ast,
      round: playerTournamentStats.round,
      gameDate: playerTournamentStats.gameDate,
      sportRadarGameId: playerTournamentStats.sportRadarGameId,
    })
    .from(playerTournamentStats)
    .limit(5);

  console.log(`\n🎲 Sample records:`);
  for (const record of samples) {
    console.log(`   ${record.id}: ${record.pts}pts ${record.reb}reb ${record.ast}ast (gameId: ${record.sportRadarGameId})`);
  }

  process.exit(0);
}

checkDuplicates().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
