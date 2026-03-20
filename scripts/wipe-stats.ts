import { db, schema } from '../api/_db.js';
import { sql } from 'drizzle-orm';

const { playerTournamentStats } = schema;

async function wipeStats() {
  console.log('⚠️  WARNING: This will DELETE ALL player tournament stats!\n');

  // Count current records
  const [count] = await db
    .select({ count: sql<number>`COUNT(*)`.as('count') })
    .from(playerTournamentStats);

  console.log(`📊 Current records: ${count?.count || 0}\n`);

  // Delete all records
  console.log('🗑️  Deleting all records...');
  await db.delete(playerTournamentStats);

  // Verify deletion
  const [afterCount] = await db
    .select({ count: sql<number>`COUNT(*)`.as('count') })
    .from(playerTournamentStats);

  console.log(`\n✅ Deletion complete!`);
  console.log(`📊 Records remaining: ${afterCount?.count || 0}`);

  if ((afterCount?.count || 0) === 0) {
    console.log(`\n🎉 All stats wiped successfully! Ready for re-sync.`);
  } else {
    console.error(`\n❌ WARNING: ${afterCount?.count} records still remain!`);
  }

  process.exit(0);
}

wipeStats().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
