import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Link,
  Button,
  Hr,
  Heading,
} from '@react-email/components';

interface WelcomeEmailProps {
  leagueName: string;
  teamName: string;
  pickRosterUrl: string;
  playerName: string;
}

export default function WelcomeEmail({
  leagueName,
  teamName,
  pickRosterUrl,
  playerName,
}: WelcomeEmailProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        Welcome to {leagueName} -- your team "{teamName}" is ready to compete!
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Heading style={logoText}>MNSfantasy</Heading>
            <Text style={tagline}>NCAA March Madness Fantasy</Text>
          </Section>

          <Hr style={divider} />

          {/* Welcome Message */}
          <Section style={contentSection}>
            <Heading as="h1" style={h1}>
              Welcome to the madness, {playerName}!
            </Heading>

            <Text style={paragraph}>
              You've joined{' '}
              <span style={highlight}>{leagueName}</span> and your team{' '}
              <span style={highlight}>"{teamName}"</span> is locked and
              loaded.
            </Text>

            <Text style={paragraph}>
              It's time to build your roster. Pick 10 players from across
              the bracket and ride them through every round. Points, rebounds,
              and assists all count -- the deeper your guys go, the more they
              rack up.
            </Text>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={ctaButton} href={pickRosterUrl}>
              Pick Your Roster &rarr;
            </Button>
          </Section>

          <Section style={contentSection}>
            <Text style={mutedText}>
              Rosters lock when the first game tips off. Get your picks in
              before then or you'll be watching from the sidelines.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* League Info Box */}
          <Section style={infoBox}>
            <Text style={infoLabel}>League</Text>
            <Text style={infoValue}>{leagueName}</Text>
            <Text style={infoLabel}>Your Team</Text>
            <Text style={infoValue}>{teamName}</Text>
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
};

const highlight: React.CSSProperties = {
  color: '#00ff87',
  fontWeight: 600,
};

const ctaSection: React.CSSProperties = {
  textAlign: 'center' as const,
  padding: '8px 0 16px',
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

const mutedText: React.CSSProperties = {
  color: '#6b7a8d',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '0 0 8px',
};

const infoBox: React.CSSProperties = {
  backgroundColor: '#0d1117',
  borderRadius: '8px',
  border: '1px solid #1e2a3a',
  padding: '20px 24px',
  margin: '0 8px',
};

const infoLabel: React.CSSProperties = {
  color: '#6b7a8d',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '1.5px',
  textTransform: 'uppercase' as const,
  margin: '0 0 2px',
};

const infoValue: React.CSSProperties = {
  color: '#f0f4f8',
  fontSize: '16px',
  fontWeight: 600,
  margin: '0 0 12px',
};

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
