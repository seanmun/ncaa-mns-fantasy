import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import Papa from 'papaparse';
import { toast } from 'sonner';
import PageTransition from '@/components/layout/PageTransition';
import { Button } from '@/components/ui/Button';
import { RefreshCw, Mail, Trash2 } from 'lucide-react';
import { GAME_CONFIGS, DEFAULT_GAME_SLUG } from '@/lib/gameConfig';

import { SectionCard } from '@/components/admin/SectionCard';
import { SportsRadarImportSection } from '@/components/admin/SportsRadarImportSection';
import { CsvUploadSection } from '@/components/admin/CsvUploadSection';
import { EliminateTeamSection } from '@/components/admin/EliminateTeamSection';
import { DeactivatePlayerSection } from '@/components/admin/DeactivatePlayerSection';
import { LeagueOverviewSection } from '@/components/admin/LeagueOverviewSection';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PlayerRow {
  team_name: string;
  seed: string;
  region: string;
  player_name: string;
  jersey: string;
  position: string;
  avg_pts: string;
  avg_reb: string;
  avg_ast: string;
  [key: string]: string;
}

interface StatsRow {
  player_name: string;
  team_name: string;
  game_date: string;
  pts: string;
  reb: string;
  ast: string;
  [key: string]: string;
}

interface SyncStatus {
  lastUpdated: string | null;
}

interface LeagueOverview {
  id: string;
  name: string;
  memberCount: number;
  adminName: string;
  createdAt: string;
}

interface TeamInfo {
  team: {
    name: string;
    isEliminated: boolean;
  };
}

const PLAYER_COLUMNS = [
  'team_name',
  'seed',
  'region',
  'player_name',
  'jersey',
  'position',
  'avg_pts',
  'avg_reb',
  'avg_ast',
] as const;

const STATS_COLUMNS = [
  'player_name',
  'team_name',
  'game_date',
  'pts',
  'reb',
  'ast',
] as const;

const TOURNAMENT_ROUNDS = [
  'Round of 64',
  'Round of 32',
  'Sweet 16',
  'Elite 8',
  'Final Four',
  'Championship',
];

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

const gameOptions = Object.values(GAME_CONFIGS);

export default function AdminPanel() {
  const { apiFetch } = useApi();
  const queryClient = useQueryClient();

  // ---- Game selector state ----
  const [selectedGame, setSelectedGame] = useState(DEFAULT_GAME_SLUG);

  // ---- Player Upload state ----
  const playerFileRef = useRef<HTMLInputElement>(null);
  const [playerPreview, setPlayerPreview] = useState<PlayerRow[] | null>(null);

  // ---- Stats Upload state ----
  const statsFileRef = useRef<HTMLInputElement>(null);
  const [statsPreview, setStatsPreview] = useState<StatsRow[] | null>(null);

  // ---- Import state ----
  const [importLog, setImportLog] = useState<string[]>([]);

  // ---- Eliminate Team state ----
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedRound, setSelectedRound] = useState(TOURNAMENT_ROUNDS[0]);
  const [showEliminateModal, setShowEliminateModal] = useState(false);

  // ---- Deactivate Player state ----
  const [deactivatePlayerName, setDeactivatePlayerName] = useState('');
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  /* ---------------------------------------------------------------- */
  /*  Queries                                                          */
  /* ---------------------------------------------------------------- */

  const { data: syncStatus } = useQuery<SyncStatus>({
    queryKey: ['stats-status'],
    queryFn: () => apiFetch('/api/stats/status'),
  });

  const { data: players } = useQuery<TeamInfo[]>({
    queryKey: ['players-teams', selectedGame],
    queryFn: () => apiFetch(`/api/players?game_slug=${selectedGame}`),
  });

  const { data: leagues } = useQuery<LeagueOverview[]>({
    queryKey: ['admin-leagues'],
    queryFn: () => apiFetch('/api/admin/leagues'),
  });

  // Extract unique active (non-eliminated) teams
  const activeTeams: string[] = players
    ? [
        ...new Set(
          players
            .filter((p) => !p.team.isEliminated)
            .map((p) => p.team.name)
        ),
      ].sort()
    : [];

  // Extract unique eliminated teams
  const eliminatedTeams: string[] = players
    ? [
        ...new Set(
          players
            .filter((p) => p.team.isEliminated)
            .map((p) => p.team.name)
        ),
      ].sort()
    : [];

  /* ---------------------------------------------------------------- */
  /*  Mutations                                                        */
  /* ---------------------------------------------------------------- */

  // Player Upload
  const uploadPlayersMutation = useMutation({
    mutationFn: (rows: PlayerRow[]) =>
      apiFetch(`/api/admin/upload-players?game_slug=${selectedGame}`, {
        method: 'POST',
        body: JSON.stringify({ players: rows }),
      }),
    onSuccess: (data: { teams: number; players: number }) => {
      toast.success(`${data.teams} teams, ${data.players} players imported`);
      setPlayerPreview(null);
      if (playerFileRef.current) playerFileRef.current.value = '';
      queryClient.invalidateQueries({ queryKey: ['players-teams'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to upload players');
    },
  });

  // Stats Sync — accepts "today" or "yesterday"
  const syncStatsMutation = useMutation({
    mutationFn: (date: 'today' | 'yesterday') =>
      apiFetch(`/api/stats/sync?game_slug=${selectedGame}&date=${date}`, { method: 'POST' }),
    onSuccess: (data: { message: string; results: Record<string, { gamesProcessed: number; statsUpserted: number; teamsEliminated: number; scoreboardUpdated: number }> }) => {
      const gameResult = data.results?.[selectedGame] || data.results?.[Object.keys(data.results)[0]];
      if (gameResult) {
        toast.success(`Sync: ${gameResult.gamesProcessed} games, ${gameResult.statsUpserted} stats, ${gameResult.teamsEliminated} eliminated, ${gameResult.scoreboardUpdated} scoreboard`);
      } else {
        toast.success(data.message || 'Stats synced successfully');
      }
      queryClient.invalidateQueries({ queryKey: ['stats-status'] });
      queryClient.invalidateQueries({ queryKey: ['todayGames'] });
      queryClient.invalidateQueries({ queryKey: ['players-teams'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to sync stats');
    },
  });

  // Manual Stats Upload
  const uploadStatsMutation = useMutation({
    mutationFn: (rows: StatsRow[]) =>
      apiFetch('/api/admin/upload-stats', {
        method: 'POST',
        body: JSON.stringify({ stats: rows }),
      }),
    onSuccess: () => {
      toast.success('Stats uploaded successfully');
      setStatsPreview(null);
      if (statsFileRef.current) statsFileRef.current.value = '';
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to upload stats');
    },
  });

  // Eliminate Team
  const eliminateTeamMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/api/admin/eliminate-team?game_slug=${selectedGame}`, {
        method: 'POST',
        body: JSON.stringify({
          teamName: selectedTeam,
          round: selectedRound,
        }),
      }),
    onSuccess: () => {
      toast.success(`${selectedTeam} has been eliminated`);
      setShowEliminateModal(false);
      setSelectedTeam('');
      queryClient.invalidateQueries({ queryKey: ['players-teams'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to eliminate team');
    },
  });

  // Restore (un-eliminate) Team
  const restoreTeamMutation = useMutation({
    mutationFn: (teamName: string) =>
      apiFetch(`/api/admin/eliminate-team?game_slug=${selectedGame}`, {
        method: 'POST',
        body: JSON.stringify({ teamName, restore: true }),
      }),
    onSuccess: (_data: unknown, teamName: string) => {
      toast.success(`${teamName} has been restored`);
      queryClient.invalidateQueries({ queryKey: ['players-teams'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to restore team');
    },
  });

  // Deactivate Player
  const deactivatePlayerMutation = useMutation({
    mutationFn: (reactivate?: boolean) =>
      apiFetch('/api/admin/deactivate-player', {
        method: 'POST',
        body: JSON.stringify({
          playerName: deactivatePlayerName,
          reactivate,
        }),
      }),
    onSuccess: (data: { message: string }) => {
      toast.success(data.message);
      setShowDeactivateModal(false);
      setDeactivatePlayerName('');
      queryClient.invalidateQueries({ queryKey: ['players-teams'] });
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update player status');
    },
  });

  // Email Blast
  const emailBlastMutation = useMutation({
    mutationFn: () =>
      apiFetch('/api/email/morning-update', { method: 'POST' }),
    onSuccess: () => {
      toast.success('Morning update emails sent to all leagues');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to send email blast');
    },
  });

  // Email Test (admin only)
  const emailTestMutation = useMutation({
    mutationFn: () =>
      apiFetch('/api/email/morning-update?test=true', { method: 'POST' }),
    onSuccess: (data: { emailsSent: number; debug?: Record<string, unknown> }) => {
      if (data.emailsSent > 0) {
        toast.success(`Test email sent (${data.emailsSent})`);
      } else {
        toast.error(`0 emails sent. Debug: ${JSON.stringify(data.debug)}`);
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to send test email');
    },
  });

  // Clear Play-in Data
  const clearPlayinMutation = useMutation({
    mutationFn: () =>
      apiFetch('/api/admin/clear-playin-data', { method: 'POST' }),
    onSuccess: (data: { deletedStats: number; deletedGames: number }) => {
      toast.success(`Cleared ${data.deletedStats} stats, ${data.deletedGames} games`);
      queryClient.invalidateQueries({ queryKey: ['stats-status'] });
      queryClient.invalidateQueries({ queryKey: ['todayGames'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to clear play-in data');
    },
  });

  // SportsRadar Import -- Step 1: Teams
  const importTeamsMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/api/admin/import-players?step=teams&game_slug=${selectedGame}`, { method: 'POST' }),
    onSuccess: (data: { teamsInserted: number; teamsUpdated: number; totalProcessed: number; message?: string; errors?: string[] }) => {
      const msg = `Teams imported: ${data.teamsInserted} new, ${data.teamsUpdated} updated (${data.totalProcessed} total)`;
      toast.success(msg);
      setImportLog((prev) => [...prev, msg]);
      if (data.errors && data.errors.length > 0) {
        for (const err of data.errors) {
          toast.error(err);
          setImportLog((prev) => [...prev, `API error: ${err}`]);
        }
      }
      if (data.message) {
        setImportLog((prev) => [...prev, data.message!]);
      }
      queryClient.invalidateQueries({ queryKey: ['players-teams'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to import teams');
      setImportLog((prev) => [...prev, `Error importing teams: ${err.message}`]);
    },
  });

  // SportsRadar Import -- Step 2: Players (batched)
  const importPlayersMutation = useMutation({
    mutationFn: (offset: number) =>
      apiFetch(`/api/admin/import-players?step=players&batchSize=10&offset=${offset}&game_slug=${selectedGame}`, {
        method: 'POST',
      }),
    onSuccess: (data: {
      playersUpserted: number;
      teamsProcessed: number;
      teamsErrored: number;
      totalTeams: number;
      nextOffset: number | null;
      done: boolean;
    }) => {
      const msg = `Batch done: ${data.playersUpserted} players from ${data.teamsProcessed} teams (${data.teamsErrored} errors). ${data.totalTeams} total teams.`;
      setImportLog((prev) => [...prev, msg]);

      if (data.done) {
        toast.success('All players imported!');
        queryClient.invalidateQueries({ queryKey: ['players-teams'] });
      } else {
        toast.info(`Batch complete. Processing next batch (offset ${data.nextOffset})...`);
        if (data.nextOffset !== null) {
          importPlayersMutation.mutate(data.nextOffset);
        }
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to import players batch');
      setImportLog((prev) => [...prev, `Error: ${err.message}`]);
    },
  });

  /* ---------------------------------------------------------------- */
  /*  CSV parse helpers                                                */
  /* ---------------------------------------------------------------- */

  const handlePlayerFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<PlayerRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          toast.error(`CSV parse error: ${results.errors[0].message}`);
          return;
        }
        setPlayerPreview(results.data);
      },
      error: (err: Error) => {
        toast.error(`Failed to read file: ${err.message}`);
      },
    });
  };

  const handleStatsFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<StatsRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          toast.error(`CSV parse error: ${results.errors[0].message}`);
          return;
        }
        setStatsPreview(results.data);
      },
      error: (err: Error) => {
        toast.error(`Failed to read file: ${err.message}`);
      },
    });
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        {/* ---- Page Header ---- */}
        <div>
          <h1 className="font-display text-3xl tracking-wide text-neon-green">
            Admin Panel
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Admin access is verified server-side
          </p>
        </div>

        {/* ---- Game Selector ---- */}
        <div className="rounded-xl bg-bg-card border border-bg-border p-4">
          <span className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
            Active Tournament
          </span>
          <div className="flex gap-2">
            {gameOptions.map((game) => (
              <button
                key={game.slug}
                type="button"
                onClick={() => setSelectedGame(game.slug)}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all duration-150 ${
                  selectedGame === game.slug
                    ? 'bg-neon-green text-gray-900 shadow-[0_0_15px_rgba(0,255,135,0.3)]'
                    : 'bg-bg-primary border border-bg-border text-text-secondary hover:text-text-primary hover:bg-bg-card-hover'
                }`}
              >
                {game.label}
              </button>
            ))}
          </div>
        </div>

        {/* SportsRadar Import */}
        <SportsRadarImportSection
          importLog={importLog}
          onImportTeams={() => {
            setImportLog([]);
            importTeamsMutation.mutate();
          }}
          onImportPlayers={() => importPlayersMutation.mutate(0)}
          importTeamsPending={importTeamsMutation.isPending}
          importPlayersPending={importPlayersMutation.isPending}
        />

        {/* Player Pool Upload (CSV) */}
        <CsvUploadSection
          title="Player Pool Upload (CSV)"
          delay={0.05}
          inputId="player-csv"
          inputLabel="Upload CSV file (team_name, seed, region, player_name, jersey, position, avg_pts, avg_reb, avg_ast)"
          fileRef={playerFileRef}
          onFileChange={handlePlayerFile}
          preview={playerPreview}
          columns={PLAYER_COLUMNS}
          onClearPreview={() => {
            setPlayerPreview(null);
            if (playerFileRef.current) playerFileRef.current.value = '';
          }}
          onConfirm={() => uploadPlayersMutation.mutate(playerPreview!)}
          confirmLoading={uploadPlayersMutation.isPending}
        />

        {/* Stats Sync */}
        <SectionCard title="Stats Sync" icon={RefreshCw} delay={0.1}>
          <div className="space-y-4">
            <p className="text-xs text-text-muted">
              Syncs scores, player stats, and eliminations from SportsRadar.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={() => syncStatsMutation.mutate('today')}
                loading={syncStatsMutation.isPending}
                className="w-full sm:w-auto"
              >
                <RefreshCw className="h-4 w-4" />
                Sync Today
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => syncStatsMutation.mutate('yesterday')}
                loading={syncStatsMutation.isPending}
                className="w-full sm:w-auto"
              >
                <RefreshCw className="h-4 w-4" />
                Sync Yesterday
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  if (window.confirm('Clear ALL player stats and active games? This cannot be undone.')) {
                    clearPlayinMutation.mutate();
                  }
                }}
                loading={clearPlayinMutation.isPending}
                className="w-full sm:w-auto text-red-400 border-red-400/30 hover:bg-red-400/10"
              >
                <Trash2 className="h-4 w-4" />
                Clear Stats & Scores
              </Button>
            </div>
            {syncStatus?.lastUpdated && (
              <p className="text-sm text-text-muted">
                Last synced:{' '}
                <span className="text-text-secondary">
                  {new Date(syncStatus.lastUpdated).toLocaleString()}
                </span>
              </p>
            )}
          </div>
        </SectionCard>

        {/* Manual Stats Upload */}
        <CsvUploadSection
          title="Manual Stats Upload"
          delay={0.15}
          inputId="stats-csv"
          inputLabel="Upload CSV file (player_name, team_name, game_date, pts, reb, ast)"
          fileRef={statsFileRef}
          onFileChange={handleStatsFile}
          preview={statsPreview}
          columns={STATS_COLUMNS}
          onClearPreview={() => {
            setStatsPreview(null);
            if (statsFileRef.current) statsFileRef.current.value = '';
          }}
          onConfirm={() => uploadStatsMutation.mutate(statsPreview!)}
          confirmLoading={uploadStatsMutation.isPending}
        />

        {/* Eliminate Team */}
        <EliminateTeamSection
          activeTeams={activeTeams}
          eliminatedTeams={eliminatedTeams}
          tournamentRounds={TOURNAMENT_ROUNDS}
          selectedTeam={selectedTeam}
          selectedRound={selectedRound}
          onTeamChange={setSelectedTeam}
          onRoundChange={setSelectedRound}
          showModal={showEliminateModal}
          onShowModal={() => setShowEliminateModal(true)}
          onConfirm={() => eliminateTeamMutation.mutate()}
          onCancel={() => setShowEliminateModal(false)}
          loading={eliminateTeamMutation.isPending}
          onRestore={(teamName) => restoreTeamMutation.mutate(teamName)}
          restoreLoading={restoreTeamMutation.isPending}
        />

        {/* Deactivate Player */}
        <DeactivatePlayerSection
          playerName={deactivatePlayerName}
          onPlayerNameChange={setDeactivatePlayerName}
          showModal={showDeactivateModal}
          onShowModal={() => setShowDeactivateModal(true)}
          onDeactivate={() => deactivatePlayerMutation.mutate(false)}
          onReactivate={() => deactivatePlayerMutation.mutate(true)}
          onCancel={() => setShowDeactivateModal(false)}
          loading={deactivatePlayerMutation.isPending}
        />

        {/* Email Blast */}
        <SectionCard title="Email Blast" icon={Mail} delay={0.25}>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => emailTestMutation.mutate()}
              loading={emailTestMutation.isPending}
              className="w-full sm:w-auto"
            >
              <Mail className="h-4 w-4" />
              Send Test to Me
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={() => emailBlastMutation.mutate()}
              loading={emailBlastMutation.isPending}
              className="w-full sm:w-auto"
            >
              <Mail className="h-4 w-4" />
              Send to All Leagues
            </Button>
          </div>
        </SectionCard>

        {/* League Overview */}
        <LeagueOverviewSection leagues={leagues} />
      </div>
    </PageTransition>
  );
}
