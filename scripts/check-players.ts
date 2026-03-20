// Quick script to check if players have SportsRadar IDs
import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import { eq, isNull, isNotNull, and, sql } from 'drizzle-orm';
import * as schema from '../src/lib/db/schema.js';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('DATABASE_URL not set');
}

const connection = neon(dbUrl);
const db = drizzle(connection, { schema });

async function checkPlayers() {
  const gameSlug = 'ncaa-mens-2026';

  // Total players
  const [total] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(schema.players)
    .where(eq(schema.players.gameSlug, gameSlug));

  // Players with SR IDs
  const [withIds] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(schema.players)
    .where(and(
      eq(schema.players.gameSlug, gameSlug),
      isNotNull(schema.players.sportRadarPlayerId)
    ));

  // Players without SR IDs
  const [withoutIds] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(schema.players)
    .where(and(
      eq(schema.players.gameSlug, gameSlug),
      isNull(schema.players.sportRadarPlayerId)
    ));

  console.log('\n=== PLAYER DATABASE STATUS ===');
  console.log(`Total players: ${total?.count || 0}`);
  console.log(`Players WITH SportsRadar IDs: ${withIds?.count || 0}`);
  console.log(`Players WITHOUT SportsRadar IDs: ${withoutIds?.count || 0}`);
  console.log(`Percentage with IDs: ${total?.count ? Math.round((withIds?.count || 0) / total.count * 100) : 0}%`);

  // Sample players without IDs
  const samplesWithout = await db
    .select({
      name: schema.players.name,
      sportRadarPlayerId: schema.players.sportRadarPlayerId,
    })
    .from(schema.players)
    .where(and(
      eq(schema.players.gameSlug, gameSlug),
      isNull(schema.players.sportRadarPlayerId)
    ))
    .limit(5);

  if (samplesWithout.length > 0) {
    console.log('\nSample players WITHOUT SR IDs:');
    samplesWithout.forEach(p => console.log(`  - ${p.name} (SR ID: ${p.sportRadarPlayerId || 'NULL'})`));
  }

  // Sample players WITH IDs
  const samplesWith = await db
    .select({
      name: schema.players.name,
      sportRadarPlayerId: schema.players.sportRadarPlayerId,
    })
    .from(schema.players)
    .where(and(
      eq(schema.players.gameSlug, gameSlug),
      isNotNull(schema.players.sportRadarPlayerId)
    ))
    .limit(5);

  if (samplesWith.length > 0) {
    console.log('\nSample players WITH SR IDs:');
    samplesWith.forEach(p => console.log(`  - ${p.name} (SR ID: ${p.sportRadarPlayerId})`));
  }

  console.log('\n');
  process.exit(0);
}

checkPlayers().catch(console.error);
