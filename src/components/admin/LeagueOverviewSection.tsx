import { Eye } from 'lucide-react';
import { SectionCard } from './SectionCard';

export interface LeagueOverview {
  id: string;
  name: string;
  memberCount: number;
  adminName: string;
  createdAt: string;
}

export interface LeagueOverviewSectionProps {
  leagues: LeagueOverview[] | undefined;
}

export function LeagueOverviewSection({
  leagues,
}: LeagueOverviewSectionProps) {
  return (
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
  );
}
