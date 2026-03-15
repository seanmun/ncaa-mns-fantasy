import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import Papa from 'papaparse';
import { toast } from 'sonner';
import PageTransition from '@/components/layout/PageTransition';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import {
  Upload,
  RefreshCw,
  Skull,
  Mail,
  Eye,
  AlertTriangle,
  X,
  Download,
} from 'lucide-react';

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
/*  Confirmation Modal                                                 */
/* ------------------------------------------------------------------ */

function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-xl border border-bg-border bg-bg-card p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neon-red/10">
            <AlertTriangle className="h-5 w-5 text-neon-red" />
          </div>
          <h3 className="font-display text-xl text-text-primary">{title}</h3>
        </div>
        <p className="mb-6 text-sm text-text-secondary">{message}</p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={onConfirm}
            loading={loading}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CSV Preview Table                                                  */
/* ------------------------------------------------------------------ */

function CsvPreviewTable({
  rows,
  columns,
}: {
  rows: Record<string, string>[];
  columns: readonly string[];
}) {
  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-bg-border">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-bg-border bg-bg-primary">
            {columns.map((col) => (
              <th
                key={col}
                className="whitespace-nowrap px-3 py-2 font-semibold text-text-secondary"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 10).map((row, i) => (
            <tr
              key={i}
              className="border-b border-bg-border/50 last:border-0"
            >
              {columns.map((col) => (
                <td
                  key={col}
                  className="whitespace-nowrap px-3 py-2 text-text-primary"
                >
                  {row[col] ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 10 && (
        <p className="px-3 py-2 text-xs text-text-muted">
          Showing 10 of {rows.length} rows
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section wrapper                                                    */
/* ------------------------------------------------------------------ */

function SectionCard({
  title,
  icon: Icon,
  delay,
  children,
}: {
  title: string;
  icon: React.ElementType;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-xl border border-bg-border bg-bg-card p-6"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neon-green/10">
          <Icon className="h-5 w-5 text-neon-green" />
        </div>
        <h2 className="font-display text-xl tracking-wide text-text-primary">
          {title}
        </h2>
      </div>
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function AdminPanel() {
  const { apiFetch } = useApi();
  const queryClient = useQueryClient();

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

  /* ---------------------------------------------------------------- */
  /*  Queries                                                          */
  /* ---------------------------------------------------------------- */

  const { data: syncStatus } = useQuery<SyncStatus>({
    queryKey: ['stats-status'],
    queryFn: () => apiFetch('/api/stats/status'),
  });

  const { data: players } = useQuery<TeamInfo[]>({
    queryKey: ['players-teams'],
    queryFn: () => apiFetch('/api/players'),
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

  /* ---------------------------------------------------------------- */
  /*  Mutations                                                        */
  /* ---------------------------------------------------------------- */

  // Player Upload
  const uploadPlayersMutation = useMutation({
    mutationFn: (rows: PlayerRow[]) =>
      apiFetch('/api/admin/upload-players', {
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

  // Stats Sync
  const syncStatsMutation = useMutation({
    mutationFn: () =>
      apiFetch('/api/stats/sync', { method: 'POST' }),
    onSuccess: () => {
      toast.success('Stats synced successfully');
      queryClient.invalidateQueries({ queryKey: ['stats-status'] });
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
      apiFetch('/api/admin/eliminate-team', {
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

  // SportsRadar Import — Step 1: Teams
  const importTeamsMutation = useMutation({
    mutationFn: () =>
      apiFetch('/api/admin/import-players?step=teams', { method: 'POST' }),
    onSuccess: (data: { teamsInserted: number; teamsUpdated: number; totalProcessed: number }) => {
      const msg = `Teams imported: ${data.teamsInserted} new, ${data.teamsUpdated} updated (${data.totalProcessed} total)`;
      toast.success(msg);
      setImportLog((prev) => [...prev, msg]);
      queryClient.invalidateQueries({ queryKey: ['players-teams'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to import teams');
      setImportLog((prev) => [...prev, `Error importing teams: ${err.message}`]);
    },
  });

  // SportsRadar Import — Step 2: Players (batched)
  const importPlayersMutation = useMutation({
    mutationFn: (offset: number) =>
      apiFetch(`/api/admin/import-players?step=players&batchSize=25&offset=${offset}`, {
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
        // Auto-continue with next batch
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

        {/* ================================================================ */}
        {/*  Section 0: SportsRadar Import                                     */}
        {/* ================================================================ */}
        <SectionCard title="SportsRadar Import" icon={Download} delay={0.03}>
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Import all NCAA teams and players with season averages directly from SportsRadar.
              Step 1 imports teams (fast). Step 2 imports players in batches (~25 teams per batch, auto-continues).
            </p>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setImportLog([]);
                  importTeamsMutation.mutate();
                }}
                loading={importTeamsMutation.isPending}
              >
                <Download className="h-4 w-4" />
                Step 1: Import Teams
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={() => importPlayersMutation.mutate(0)}
                loading={importPlayersMutation.isPending}
              >
                <Download className="h-4 w-4" />
                Step 2: Import Players
              </Button>
            </div>

            {importLog.length > 0 && (
              <div className="rounded-lg border border-bg-border bg-bg-primary p-4 max-h-48 overflow-y-auto">
                <p className="mb-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Import Log
                </p>
                {importLog.map((line, i) => (
                  <p key={i} className="text-xs text-text-secondary py-0.5">
                    {line}
                  </p>
                ))}
                {importPlayersMutation.isPending && (
                  <p className="text-xs text-neon-cyan py-0.5 animate-pulse">
                    Processing batch...
                  </p>
                )}
              </div>
            )}
          </div>
        </SectionCard>

        {/* ================================================================ */}
        {/*  Section 1: Player Pool Upload                                    */}
        {/* ================================================================ */}
        <SectionCard title="Player Pool Upload (CSV)" icon={Upload} delay={0.05}>
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label
                  htmlFor="player-csv"
                  className="mb-1 block text-xs text-text-muted"
                >
                  Upload CSV file (team_name, seed, region, player_name, jersey,
                  position, avg_pts, avg_reb, avg_ast)
                </label>
                <input
                  ref={playerFileRef}
                  id="player-csv"
                  type="file"
                  accept=".csv"
                  onChange={handlePlayerFile}
                  className="w-full rounded-lg border border-bg-border bg-bg-primary px-4 py-2.5 text-sm text-text-primary file:mr-3 file:rounded-md file:border-0 file:bg-neon-green/10 file:px-3 file:py-1 file:text-sm file:font-medium file:text-neon-green transition-colors focus:border-neon-green focus:outline-none"
                />
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => playerFileRef.current?.click()}
                disabled={!!playerPreview}
              >
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </div>

            {playerPreview && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-text-secondary">
                    Preview ({playerPreview.length} rows)
                  </p>
                  <button
                    onClick={() => {
                      setPlayerPreview(null);
                      if (playerFileRef.current)
                        playerFileRef.current.value = '';
                    }}
                    className="text-text-muted hover:text-text-primary transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <CsvPreviewTable
                  rows={playerPreview}
                  columns={PLAYER_COLUMNS}
                />
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => uploadPlayersMutation.mutate(playerPreview)}
                  loading={uploadPlayersMutation.isPending}
                >
                  Confirm Import
                </Button>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ================================================================ */}
        {/*  Section 2: Stats Sync                                            */}
        {/* ================================================================ */}
        <SectionCard title="Stats Sync" icon={RefreshCw} delay={0.1}>
          <div className="space-y-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => syncStatsMutation.mutate()}
              loading={syncStatsMutation.isPending}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="h-4 w-4" />
              Sync Stats from SportsRadar
            </Button>
            {syncStatus?.lastUpdated && (
              <p className="text-sm text-text-muted">
                Last synced:{' '}
                <span className="text-text-secondary">
                  {new Date(syncStatus.lastUpdated).toLocaleString()}
                </span>
              </p>
            )}
            {!syncStatus?.lastUpdated && (
              <p className="text-sm text-text-muted">
                No sync data available yet
              </p>
            )}
          </div>
        </SectionCard>

        {/* ================================================================ */}
        {/*  Section 3: Manual Stats Upload                                   */}
        {/* ================================================================ */}
        <SectionCard title="Manual Stats Upload" icon={Upload} delay={0.15}>
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label
                  htmlFor="stats-csv"
                  className="mb-1 block text-xs text-text-muted"
                >
                  Upload CSV file (player_name, team_name, game_date, pts, reb,
                  ast)
                </label>
                <input
                  ref={statsFileRef}
                  id="stats-csv"
                  type="file"
                  accept=".csv"
                  onChange={handleStatsFile}
                  className="w-full rounded-lg border border-bg-border bg-bg-primary px-4 py-2.5 text-sm text-text-primary file:mr-3 file:rounded-md file:border-0 file:bg-neon-green/10 file:px-3 file:py-1 file:text-sm file:font-medium file:text-neon-green transition-colors focus:border-neon-green focus:outline-none"
                />
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => statsFileRef.current?.click()}
                disabled={!!statsPreview}
              >
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </div>

            {statsPreview && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-text-secondary">
                    Preview ({statsPreview.length} rows)
                  </p>
                  <button
                    onClick={() => {
                      setStatsPreview(null);
                      if (statsFileRef.current)
                        statsFileRef.current.value = '';
                    }}
                    className="text-text-muted hover:text-text-primary transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <CsvPreviewTable
                  rows={statsPreview}
                  columns={STATS_COLUMNS}
                />
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => uploadStatsMutation.mutate(statsPreview)}
                  loading={uploadStatsMutation.isPending}
                >
                  Confirm Import
                </Button>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ================================================================ */}
        {/*  Section 4: Eliminate Team                                         */}
        {/* ================================================================ */}
        <SectionCard title="Eliminate Team" icon={Skull} delay={0.2}>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Team select */}
              <div>
                <label
                  htmlFor="team-select"
                  className="mb-1 block text-xs text-text-muted"
                >
                  Select Team
                </label>
                <select
                  id="team-select"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full rounded-lg border border-bg-border bg-bg-primary px-4 py-2.5 text-sm text-text-primary focus:border-neon-green focus:outline-none focus:ring-1 focus:ring-neon-green transition-colors"
                >
                  <option value="">Choose a team...</option>
                  {activeTeams.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
              </div>

              {/* Round select */}
              <div>
                <label
                  htmlFor="round-select"
                  className="mb-1 block text-xs text-text-muted"
                >
                  Elimination Round
                </label>
                <select
                  id="round-select"
                  value={selectedRound}
                  onChange={(e) => setSelectedRound(e.target.value)}
                  className="w-full rounded-lg border border-bg-border bg-bg-primary px-4 py-2.5 text-sm text-text-primary focus:border-neon-green focus:outline-none focus:ring-1 focus:ring-neon-green transition-colors"
                >
                  {TOURNAMENT_ROUNDS.map((round) => (
                    <option key={round} value={round}>
                      {round}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              variant="danger"
              size="md"
              onClick={() => setShowEliminateModal(true)}
              disabled={!selectedTeam}
            >
              <Skull className="h-4 w-4" />
              Eliminate
            </Button>
          </div>

          <ConfirmModal
            open={showEliminateModal}
            title="Eliminate Team"
            message={`Are you sure you want to eliminate ${selectedTeam}? This will affect all rosters.`}
            confirmLabel="Eliminate"
            onConfirm={() => eliminateTeamMutation.mutate()}
            onCancel={() => setShowEliminateModal(false)}
            loading={eliminateTeamMutation.isPending}
          />
        </SectionCard>

        {/* ================================================================ */}
        {/*  Section 5: Email Blast                                           */}
        {/* ================================================================ */}
        <SectionCard title="Email Blast" icon={Mail} delay={0.25}>
          <Button
            variant="primary"
            size="lg"
            onClick={() => emailBlastMutation.mutate()}
            loading={emailBlastMutation.isPending}
            className="w-full sm:w-auto"
          >
            <Mail className="h-4 w-4" />
            Send Morning Update to All Leagues
          </Button>
        </SectionCard>

        {/* ================================================================ */}
        {/*  Section 6: League Overview                                       */}
        {/* ================================================================ */}
        <SectionCard title="League Overview" icon={Eye} delay={0.3}>
          {leagues && leagues.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-bg-border">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-bg-border bg-bg-primary">
                    <th className="whitespace-nowrap px-4 py-3 font-semibold text-text-secondary">
                      League Name
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold text-text-secondary">
                      Members
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold text-text-secondary">
                      Admin
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold text-text-secondary">
                      Created Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leagues.map((league) => (
                    <tr
                      key={league.id}
                      className="border-b border-bg-border/50 last:border-0 bg-bg-card"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-text-primary font-medium">
                        {league.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                        {league.memberCount}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                        {league.adminName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-text-muted">
                        {new Date(league.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-text-muted">
              No leagues found or still loading...
            </p>
          )}
        </SectionCard>
      </div>
    </PageTransition>
  );
}
