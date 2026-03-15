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

interface RosterPick {
  playerName: string;
  teamName: string;
  seed: number;
  projectedScore: number;
}

interface RosterLockedEmailProps {
  playerName: string;
  teamName: string;
  leagueName: string;
  picks: RosterPick[];
  projectedTotal: number;
  leagueUrl: string;
}

export default function RosterLockedEmail({
  playerName,
  teamName,
  leagueName,
  picks,
  projectedTotal,
  leagueUrl,
}: RosterLockedEmailProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        Roster locked for "{teamName}" in {leagueName} -- good luck!
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Heading style={logoText}>MNSfantasy</Heading>
            <Text style={tagline}>NCAA March Madness Fantasy</Text>
          </Section>

          <Hr style={divider} />

          {/* Lock Notification */}
          <Section style={contentSection}>
            <Text style={lockIcon}>&#x1F512;</Text>
            <Heading as="h1" style={h1}>
              Roster Locked, {playerName}
            </Heading>

            <Text style={paragraph}>
              Your roster for{' '}
              <span style={highlight}>"{teamName}"</span> in{' '}
              <span style={highlight}>{leagueName}</span> is officially
              locked. No more changes -- it's all on the court now.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Picks Table */}
          <Section style={sectionBlock}>
            <Heading as="h2" style={h2}>
              Your 10 Picks
            </Heading>

            {/* Table header */}
            <Section style={tableHeader}>
              <Row>
                <Column style={{ ...thCell, width: '30px' }}>#</Column>
                <Column style={{ ...thCell, textAlign: 'left' as const }}>
                  Player
                </Column>
                <Column style={{ ...thCell, width: '100px' }}>Team</Column>
                <Column style={{ ...thCell, width: '50px' }}>Seed</Column>
                <Column
                  style={{
                    ...thCell,
                    width: '70px',
                    textAlign: 'right' as const,
                  }}
                >
                  Proj.
                </Column>
              </Row>
            </Section>

            {/* Pick rows */}
            {picks.map((pick, i) => (
              <Section
                key={`pick-${i}`}
                style={i % 2 === 0 ? tableRowEven : tableRowOdd}
              >
                <Row>
                  <Column style={{ ...tdCell, width: '30px', color: '#6b7a8d' }}>
                    {i + 1}
                  </Column>
                  <Column
                    style={{
                      ...tdCell,
                      textAlign: 'left' as const,
                      fontWeight: 600,
                    }}
                  >
                    {pick.playerName}
                  </Column>
                  <Column style={{ ...tdCell, width: '100px', color: '#8b95a5' }}>
                    {pick.teamName}
                  </Column>
                  <Column style={{ ...tdCell, width: '50px' }}>
                    <span style={seedBadge}>{pick.seed}</span>
                  </Column>
                  <Column
                    style={{
                      ...tdCell,
                      width: '70px',
                      textAlign: 'right' as const,
                      fontFamily: 'monospace',
                      color: '#c8d1dc',
                    }}
                  >
                    {pick.projectedScore}
                  </Column>
                </Row>
              </Section>
            ))}

            {/* Projected total row */}
            <Section style={totalRow}>
              <Row>
                <Column style={{ ...tdCell, textAlign: 'left' as const }} colSpan={4}>
                  <Text style={totalLabel}>Projected Total</Text>
                </Column>
                <Column
                  style={{
                    ...tdCell,
                    width: '70px',
                    textAlign: 'right' as const,
                  }}
                >
                  <Text style={totalValue}>{projectedTotal}</Text>
                </Column>
              </Row>
            </Section>
          </Section>

          <Hr style={divider} />

          {/* Good luck message */}
          <Section style={luckSection}>
            <Text style={luckText}>
              Good luck! May your underdogs survive.
            </Text>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={ctaButton} href={leagueUrl}>
              View Standings &rarr;
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
  textAlign: 'center' as const,
};

const lockIcon: React.CSSProperties = {
  fontSize: '48px',
  margin: '0 0 8px',
  lineHeight: '1',
};

const h1: React.CSSProperties = {
  color: '#f0f4f8',
  fontSize: '24px',
  fontWeight: 700,
  lineHeight: '1.3',
  margin: '0 0 16px',
};

const paragraph: React.CSSProperties = {
  color: '#c8d1dc',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 14px',
  textAlign: 'left' as const,
};

const highlight: React.CSSProperties = {
  color: '#00ff87',
  fontWeight: 600,
};

const sectionBlock: React.CSSProperties = {
  padding: '0 8px',
};

const h2: React.CSSProperties = {
  color: '#00ff87',
  fontSize: '14px',
  fontWeight: 700,
  letterSpacing: '1.5px',
  textTransform: 'uppercase' as const,
  margin: '0 0 12px',
};

// ---- Picks table ----
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
  padding: '8px 8px',
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
  padding: '10px 8px',
  textAlign: 'center' as const,
};

const seedBadge: React.CSSProperties = {
  backgroundColor: '#1e2a3a',
  color: '#8b95a5',
  fontSize: '11px',
  fontWeight: 700,
  padding: '2px 8px',
  borderRadius: '10px',
  display: 'inline-block',
};

const totalRow: React.CSSProperties = {
  backgroundColor: '#0d1117',
  borderTop: '2px solid #00ff87',
  borderRadius: '0 0 6px 6px',
  padding: '0',
};

const totalLabel: React.CSSProperties = {
  color: '#f0f4f8',
  fontSize: '14px',
  fontWeight: 700,
  margin: 0,
};

const totalValue: React.CSSProperties = {
  color: '#00ff87',
  fontSize: '18px',
  fontWeight: 700,
  fontFamily: 'monospace',
  margin: 0,
};

// ---- Good luck ----
const luckSection: React.CSSProperties = {
  textAlign: 'center' as const,
  padding: '0 8px',
};

const luckText: React.CSSProperties = {
  color: '#f0f4f8',
  fontSize: '18px',
  fontWeight: 600,
  fontStyle: 'italic',
  margin: '0 0 16px',
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
