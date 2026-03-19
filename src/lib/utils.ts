import { type ClassValue, clsx } from 'clsx';
import { isGameRosterLocked, getGameRosterLockDate, DEFAULT_GAME_SLUG } from './gameConfig';

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

export function isRosterLocked(gameSlug?: string): boolean {
  return isGameRosterLocked(gameSlug || DEFAULT_GAME_SLUG);
}

export function getRosterLockDate(gameSlug?: string): Date {
  return getGameRosterLockDate(gameSlug || DEFAULT_GAME_SLUG);
}

export function getPlatformUrl(): string {
  return import.meta.env.VITE_PLATFORM_URL || 'https://mnsfantasy.com';
}

export function getAppUrl(): string {
  return import.meta.env.VITE_APP_URL || 'https://ncaa.mnsfantasy.com';
}
