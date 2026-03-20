// Re-sync stats by calling the API endpoint
const CRON_SECRET = process.env.CRON_SECRET || '34c53b6a6a159a4a237c91931a37228fbb1c3de362273927b1efc25d023d0c79';
const API_URL = process.env.API_URL || 'http://localhost:3000';

async function resyncStats(date: string) {
  console.log(`\n🔄 Syncing stats for ${date}...\n`);

  const response = await fetch(`${API_URL}/api/stats/sync?date=${date}&game_slug=ncaa-mens-2026`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CRON_SECRET}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`❌ Sync failed: ${response.status} ${response.statusText}`);
    console.error(error);
    return null;
  }

  const result = await response.json();
  return result;
}

async function main() {
  console.log('🎯 Starting fresh stats sync with fixed rebounds calculation\n');

  // Sync yesterday and today
  const dates = ['yesterday', 'today'];

  for (const date of dates) {
    const result = await resyncStats(date);

    if (result?.data) {
      console.log(`✅ ${date.toUpperCase()} sync complete:`);
      console.log(JSON.stringify(result.data.results, null, 2));
      console.log('');
    }

    // Wait 3 minutes between syncs to respect rate limit
    if (date !== dates[dates.length - 1]) {
      console.log('⏳ Waiting 3 minutes for rate limit...\n');
      await new Promise(resolve => setTimeout(resolve, 180000));
    }
  }

  console.log('\n🎉 All syncs complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
