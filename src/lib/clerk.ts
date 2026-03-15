// Clerk configuration for MNSfantasy platform
// PLATFORM PATTERN — same Clerk app across all subdomains

export const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Allowed redirect origins for cross-subdomain auth
export const ALLOWED_REDIRECT_ORIGINS = [
  'https://mnsfantasy.com',
  'https://ncaa.mnsfantasy.com',
  'https://wncaa.mnsfantasy.com',
  'https://pga.mnsfantasy.com',
  'https://nfl.mnsfantasy.com',
  'http://localhost:5173', // dev
];
