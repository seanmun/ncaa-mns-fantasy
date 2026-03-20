// Quick script to fetch a game summary and inspect the statistics structure
const API_KEY = process.env.SPORTSRADAR_API_KEY || '9Mq175DOMaD6aOY5AhvXoPAdR87n1rr4wdPK7ZsG';
const BASE_URL = 'https://api.sportradar.com/ncaamb/trial/v8/en';

// Use a recent game ID - let's fetch today's schedule first
const now = new Date();
const year = 2026;
const month = '03';
const day = '20';

async function inspectAPI() {
  console.log(`\n🔍 Fetching schedule for ${year}/${month}/${day}...\n`);

  const scheduleRes = await fetch(
    `${BASE_URL}/games/${year}/${month}/${day}/schedule.json?api_key=${API_KEY}`
  );

  if (!scheduleRes.ok) {
    console.error(`Schedule API error: ${scheduleRes.status}`);
    return;
  }

  const scheduleData = await scheduleRes.json();
  const games = scheduleData.games || [];

  console.log(`Found ${games.length} games\n`);

  if (games.length === 0) {
    console.log('No games found for today');
    return;
  }

  // Pick first game
  const game = games[0];
  const gameId = game.id;

  console.log(`\n📊 Fetching box score for: ${game.away?.name} @ ${game.home?.name}`);
  console.log(`Game ID: ${gameId}\n`);

  await new Promise((resolve) => setTimeout(resolve, 1100));

  const boxScoreRes = await fetch(
    `${BASE_URL}/games/${gameId}/summary.json?api_key=${API_KEY}`
  );

  if (!boxScoreRes.ok) {
    console.error(`Box score API error: ${boxScoreRes.status}`);
    return;
  }

  const boxScore = await boxScoreRes.json();

  // Inspect first player's statistics object
  const homeTeam = boxScore.home;
  const firstPlayer = homeTeam?.players?.[0];

  if (!firstPlayer) {
    console.log('No players found in box score');
    return;
  }

  console.log(`\n👤 First player: ${firstPlayer.full_name || firstPlayer.name}`);
  console.log(`\n📈 Statistics object structure:`);
  console.log(JSON.stringify(firstPlayer.statistics, null, 2));

  // Check all possible rebound fields
  const stats = firstPlayer.statistics || {};
  console.log(`\n🏀 Rebound-related fields:`);
  console.log(`   rebounds: ${stats.rebounds}`);
  console.log(`   offensive_rebounds: ${stats.offensive_rebounds}`);
  console.log(`   defensive_rebounds: ${stats.defensive_rebounds}`);
  console.log(`   total_rebounds: ${stats.total_rebounds}`);

  if (stats.offensive_rebounds !== undefined && stats.defensive_rebounds !== undefined) {
    const oreb = stats.offensive_rebounds || 0;
    const dreb = stats.defensive_rebounds || 0;
    const reb = stats.rebounds || 0;
    console.log(`\n⚠️  POTENTIAL ISSUE:`);
    console.log(`   offensive_rebounds: ${oreb}`);
    console.log(`   defensive_rebounds: ${dreb}`);
    console.log(`   Sum (oreb + dreb): ${oreb + dreb}`);
    console.log(`   rebounds field: ${reb}`);
    console.log(`   Are they equal? ${oreb + dreb === reb ? 'YES ✅' : 'NO ❌'}`);
  }

  // Check a few more players
  console.log(`\n\n📋 Checking all ${homeTeam.players.length} players from ${homeTeam.name}:`);
  for (let i = 0; i < Math.min(5, homeTeam.players.length); i++) {
    const player = homeTeam.players[i];
    const s = player.statistics || {};
    console.log(`   ${player.full_name || player.name}: pts=${s.points}, reb=${s.rebounds}, oreb=${s.offensive_rebounds}, dreb=${s.defensive_rebounds}, ast=${s.assists}`);
  }
}

inspectAPI().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
