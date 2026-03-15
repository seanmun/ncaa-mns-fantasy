import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Link,
  Button,
  Hr,
  Heading,
} from '@react-email/components';

interface StandingRow {
  rank: number;
  teamName: string;
  totalScore: number;
}

interface TopPerformer {
  playerName: string;
  teamName: string;
  pts: number;
  reb: number;
  ast: number;
  total: number;
}

interface Elimination {
  teamName: string;
  round: string;
}

interface TodayGame {
  homeTeam: string;
  awayTeam: string;
  time: string;
}

interface MorningUpdateEmailProps {
  leagueName: string;
  date: string;
  standings: StandingRow[];
  topPerformers: TopPerformer[];
  eliminations: Elimination[];
  todayGames: TodayGame[];
  recipientPlayerNames: string[];
  leagueUrl: string;
}

export default function MorningUpdateEmail({
  leagueName,
  date,
  standings,
  topPerformers,
  eliminations,
  todayGames,
  recipientPlayerNames,
  leagueUrl,
}: MorningUpdateEmailProps) {
  const recipientSet = new Set(
    recipientPlayerNames.map((n) => n.toLowerCase())
  );

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        MNSfantasy Update -- {leagueName} | {date}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Heading style={logoText}>MNSfantasy</Heading>
            <Text style={tagline}>NCAA March Madness Fantasy</Text>
          </Section>

          <Hr style={divider} />

          <Section style={contentSection}>
            <Text style={dateLine}>{date}</Text>
            <Heading as="h1" style={h1}>
              Morning Update &mdash; {leagueName}
            </Heading>
          </Section>

          {/* ----------------------------------------------------------------
            SECTION 1: League Standings
          ----------------------------------------------------------------- */}
          <Section style={sectionBlock}>
            <Heading as="h2" style={h2}>
              League Standings
            </Heading>

            {/* Table header */}
            <Section style={tableHeader}>
              <Row>
                <Column style={{ ...thCell, width: '40px' }}>#</Column>
                <Column style={{ ...thCell, textAlign: 'left' as const }}>
                  Team
                </Column>
                <Column style={{ ...thCell, width: '80px', textAlign: 'right' as const }}>
                  Score
                </Column>
              </Row>
            </Section>

            {/* Table rows */}
            {standings.map((s, i) => (
              <Section
                key={`standing-${i}`}
                style={i % 2 === 0 ? tableRowEven : tableRowOdd}
              >
                <Row>
                  <Column style={{ ...tdCell, width: '40px', fontWeight: 700 }}>
                    {s.rank === 1 ? '\uD83C\uDFC6' : s.rank}
                  </Column>
                  <Column style={{ ...tdCell, textAlign: 'left' as const }}>
                    {s.teamName}
                  </Column>
                  <Column
                    style={{
                      ...tdCell,
                      width: '80px',
                      textAlign: 'right' as const,
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: '#00ff87',
                    }}
                  >
                    {s.totalScore}
                  </Column>
                </Row>
              </Section>
            ))}
          </Section>

          <Hr style={divider} />

          {/* ----------------------------------------------------------------
            SECTION 2: Yesterday's Top Performers
          ----------------------------------------------------------------- */}
          {topPerformers.length > 0 && (
            <>
              <Section style={sectionBlock}>
                <Heading as="h2" style={h2}>
                  Yesterday's Top Performers
                </Heading>

                {topPerformers.map((p, i) => {
                  const isRecipients = recipientSet.has(p.playerName.toLowerCase());
                  return (
                    <Section key={`perf-${i}`} style={performerRow}>
                      <Row>
                        <Column style={{ width: '32px' }}>
                          <Text
                            style={{
                              ...perfRank,
                              color: i === 0 ? '#00ff87' : '#6b7a8d',
                            }}
                          >
                            {i + 1}
                          </Text>
                        </Column>
                        <Column>
                          <Text
                            style={{
                              ...perfName,
                              color: isRecipients ? '#00ff87' : '#f0f4f8',
                            }}
                          >
                            {p.playerName}
                          </Text>
                          <Text style={perfTeam}>{p.teamName}</Text>
                        </Column>
                        <Column style={{ width: '160px', textAlign: 'right' as const }}>
                          <Text style={perfStats}>
                            {p.pts}pts &middot; {p.reb}reb &middot; {p.ast}ast
                          </Text>
                          <Text style={perfTotal}>{p.total} total</Text>
                        </Column>
                      </Row>
                    </Section>
                  );
                })}
              </Section>

              <Hr style={divider} />
            </>
          )}

          {/* ----------------------------------------------------------------
            SECTION 3: Eliminations
          ----------------------------------------------------------------- */}
          {eliminations.length > 0 && (
            <>
              <Section style={sectionBlock}>
                <Heading as="h2" style={h2}>
                  Eliminated Yesterday
                </Heading>

                {eliminations.map((e, i) => (
                  <Section key={`elim-${i}`} style={elimRow}>
                    <Row>
                      <Column style={{ width: '24px' }}>
                        <Text style={elimIcon}>&times;</Text>
                      </Column>
                      <Column>
                        <Text style={elimName}>{e.teamName}</Text>
                      </Column>
                      <Column style={{ textAlign: 'right' as const }}>
                        <Text style={elimRound}>{e.round}</Text>
                      </Column>
                    </Row>
                  </Section>
                ))}
              </Section>

              <Hr style={divider} />
            </>
          )}

          {/* ----------------------------------------------------------------
            SECTION 4: Today's Games
          ----------------------------------------------------------------- */}
          {todayGames.length > 0 && (
            <>
              <Section style={sectionBlock}>
                <Heading as="h2" style={h2}>
                  Games Today
                </Heading>

                {todayGames.map((g, i) => {
                  const homeHighlight = recipientSet.has(g.homeTeam.toLowerCase());
                  const awayHighlight = recipientSet.has(g.awayTeam.toLowerCase());

                  return (
                    <Section key={`game-${i}`} style={gameRow}>
                      <Row>
                        <Column>
                          <Text
                            style={{
                              ...gameTeam,
                              fontWeight: awayHighlight ? 700 : 400,
                              color: awayHighlight ? '#00ff87' : '#f0f4f8',
                            }}
                          >
                            {g.awayTeam}
                          </Text>
                        </Column>
                        <Column style={{ width: '40px', textAlign: 'center' as const }}>
                          <Text style={gameVs}>vs</Text>
                        </Column>
                        <Column>
                          <Text
                            style={{
                              ...gameTeam,
                              fontWeight: homeHighlight ? 700 : 400,
                              color: homeHighlight ? '#00ff87' : '#f0f4f8',
                            }}
                          >
                            {g.homeTeam}
                          </Text>
                        </Column>
                        <Column style={{ width: '80px', textAlign: 'right' as const }}>
                          <Text style={gameTime}>{g.time}</Text>
                        </Column>
                      </Row>
                    </Section>
                  );
                })}
              </Section>

              <Hr style={divider} />
            </>
          )}

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={ctaButton} href={leagueUrl}>
              View Full Standings &rarr;
            </Button>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              You're receiving this because you play MNSfantasy.
            </Text>
            <Text style={footerText}>
              <Link href="https://mnsfantasy.com/preferences" style={footerLink}>
                Manage preferences
              </Link>
              {' \u00B7 '}
              <Link
                href="https://mnsfantasy.com/preferences?unsubscribe=all"
                style={footerLink}
              >
                Unsubscribe from all
              </Link>
            </Text>
            <Text style={footerBrand}>
              MNSfantasy &middot; Powered by{' '}
              <Link href="https://moneyneversleeps.app" style={footerLink}>
                MoneyNeverSleeps.app
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ---------------------------------------------------------------------------
// Inline styles
// ---------------------------------------------------------------------------

const main: React.CSSProperties = {
  backgroundColor: '#080b10',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: 0,
  padding: 0,
};

const container: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '0 20px',
};

const headerSection: React.CSSProperties = {
  textAlign: 'center' as const,
  padding: '40px 0 16px',
};

const logoText: React.CSSProperties = {
  color: '#00ff87',
  fontSize: '28px',
  fontWeight: 700,
  letterSpacing: '1px',
  margin: 0,
};

const tagline: React.CSSProperties = {
  color: '#8b95a5',
  fontSize: '13px',
  letterSpacing: '2px',
  textTransform: 'uppercase' as const,
  margin: '4px 0 0',
};

const divider: React.CSSProperties = {
  borderColor: '#1e2a3a',
  borderTop: '1px solid #1e2a3a',
  margin: '24px 0',
};

const contentSection: React.CSSProperties = {
  padding: '0 8px',
};

const dateLine: React.CSSProperties = {
  color: '#6b7a8d',
  fontSize: '13px',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  margin: '0 0 4px',
};

const h1: React.CSSProperties = {
  color: '#f0f4f8',
  fontSize: '22px',
  fontWeight: 700,
  lineHeight: '1.3',
  margin: '0 0 8px',
};

const h2: React.CSSProperties = {
  color: '#00ff87',
  fontSize: '14px',
  fontWeight: 700,
  letterSpacing: '1.5px',
  textTransform: 'uppercase' as const,
  margin: '0 0 12px',
};

const sectionBlock: React.CSSProperties = {
  padding: '0 8px',
};

// ---- Standings table ----
const tableHeader: React.CSSProperties = {
  backgroundColor: '#0d1117',
  borderRadius: '6px 6px 0 0',
  padding: '0',
};

const thCell: React.CSSProperties = {
  color: '#6b7a8d',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  padding: '8px 12px',
  textAlign: 'center' as const,
};

const tableRowEven: React.CSSProperties = {
  backgroundColor: '#0d1117',
  padding: '0',
};

const tableRowOdd: React.CSSProperties = {
  backgroundColor: '#111820',
  padding: '0',
};

const tdCell: React.CSSProperties = {
  color: '#f0f4f8',
  fontSize: '14px',
  padding: '10px 12px',
  textAlign: 'center' as const,
};

// ---- Top performers ----
const performerRow: React.CSSProperties = {
  borderBottom: '1px solid #1e2a3a',
  padding: '8px 0',
};

const perfRank: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  margin: 0,
  lineHeight: '1',
  paddingTop: '4px',
};

const perfName: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 600,
  margin: '0 0 2px',
  lineHeight: '1.2',
};

const perfTeam: React.CSSProperties = {
  color: '#6b7a8d',
  fontSize: '12px',
  margin: 0,
  lineHeight: '1.2',
};

const perfStats: React.CSSProperties = {
  color: '#c8d1dc',
  fontSize: '12px',
  fontFamily: 'monospace',
  margin: '0 0 2px',
  lineHeight: '1.2',
};

const perfTotal: React.CSSProperties = {
  color: '#00ff87',
  fontSize: '14px',
  fontWeight: 700,
  fontFamily: 'monospace',
  margin: 0,
  lineHeight: '1.2',
};

// ---- Eliminations ----
const elimRow: React.CSSProperties = {
  borderBottom: '1px solid #1e2a3a',
  padding: '8px 0',
};

const elimIcon: React.CSSProperties = {
  color: '#ff4d4d',
  fontSize: '18px',
  fontWeight: 700,
  margin: 0,
  lineHeight: '1',
};

const elimName: React.CSSProperties = {
  color: '#f0f4f8',
  fontSize: '14px',
  fontWeight: 600,
  margin: 0,
  textDecoration: 'line-through',
};

const elimRound: React.CSSProperties = {
  color: '#6b7a8d',
  fontSize: '12px',
  margin: 0,
};

// ---- Today's games ----
const gameRow: React.CSSProperties = {
  backgroundColor: '#0d1117',
  borderRadius: '6px',
  padding: '10px 12px',
  marginBottom: '6px',
};

const gameTeam: React.CSSProperties = {
  fontSize: '14px',
  margin: 0,
  lineHeight: '1.3',
};

const gameVs: React.CSSProperties = {
  color: '#6b7a8d',
  fontSize: '11px',
  fontWeight: 600,
  margin: 0,
  textTransform: 'uppercase' as const,
};

const gameTime: React.CSSProperties = {
  color: '#8b95a5',
  fontSize: '13px',
  fontFamily: 'monospace',
  margin: 0,
};

// ---- CTA ----
const ctaSection: React.CSSProperties = {
  textAlign: 'center' as const,
  padding: '8px 0',
};

const ctaButton: React.CSSProperties = {
  backgroundColor: '#00ff87',
  color: '#080b10',
  fontSize: '16px',
  fontWeight: 700,
  padding: '14px 32px',
  borderRadius: '8px',
  textDecoration: 'none',
  display: 'inline-block',
};

// ---- Footer ----
const footerSection: React.CSSProperties = {
  textAlign: 'center' as const,
  padding: '0 0 40px',
};

const footerText: React.CSSProperties = {
  color: '#4a5568',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '0 0 4px',
};

const footerLink: React.CSSProperties = {
  color: '#6b7a8d',
  textDecoration: 'underline',
};

const footerBrand: React.CSSProperties = {
  color: '#4a5568',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '12px 0 0',
};
