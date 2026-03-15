import { type ClassValue, clsx } from 'clsx';

// Lightweight clsx without tailwind-merge (not needed with careful class usage)
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatScore(score: number): string {
  return score.toLocaleString();
}

export function truncateAddress(address: string, chars = 6): string {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function getProjectedScore(avgPts: string, avgReb: string, avgAst: string): number {
  return parseFloat(avgPts) + parseFloat(avgReb) + parseFloat(avgAst);
}

export function isRosterLocked(): boolean {
  const lockDate = import.meta.env.VITE_ROSTER_LOCK_DATE || '2025-03-20T12:00:00-05:00';
  return new Date() >= new Date(lockDate);
}

export function getRosterLockDate(): Date {
  const lockDate = import.meta.env.VITE_ROSTER_LOCK_DATE || '2025-03-20T12:00:00-05:00';
  return new Date(lockDate);
}

export function getGameSlug(): string {
  return import.meta.env.VITE_GAME_SLUG || 'ncaa-mens-2025';
}

export function getPlatformUrl(): string {
  return import.meta.env.VITE_PLATFORM_URL || 'https://mnsfantasy.com';
}

export function getAppUrl(): string {
  return import.meta.env.VITE_APP_URL || 'https://ncaa.mnsfantasy.com';
}
