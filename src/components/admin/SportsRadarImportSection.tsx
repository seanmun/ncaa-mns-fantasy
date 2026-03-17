import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SectionCard } from './SectionCard';

export interface SportsRadarImportSectionProps {
  importLog: string[];
  onImportTeams: () => void;
  onImportPlayers: () => void;
  importTeamsPending: boolean;
  importPlayersPending: boolean;
}

export function SportsRadarImportSection({
  importLog,
  onImportTeams,
  onImportPlayers,
  importTeamsPending,
  importPlayersPending,
}: SportsRadarImportSectionProps) {
  return (
    <SectionCard title="SportsRadar Import" icon={Download} delay={0.03}>
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Import all NCAA teams and players with season averages directly from
          SportsRadar. Step 1 imports teams (fast). Step 2 imports players in
          batches (~25 teams per batch, auto-continues).
        </p>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={onImportTeams}
            loading={importTeamsPending}
          >
            <Download className="h-4 w-4" />
            Step 1: Import Teams
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={onImportPlayers}
            loading={importPlayersPending}
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
            {importPlayersPending && (
              <p className="text-xs text-neon-cyan py-0.5 animate-pulse">
                Processing batch...
              </p>
            )}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
