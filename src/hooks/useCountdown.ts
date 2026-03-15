import { useState, useEffect } from 'react';
import { getRosterLockDate } from '@/lib/utils';

interface CountdownValues {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isLocked: boolean;
  isUrgent: boolean; // < 24 hours
  isCritical: boolean; // < 1 hour
  totalMs: number;
}

export function useCountdown(): CountdownValues {
  const lockDate = getRosterLockDate();

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const diff = lockDate.getTime() - now.getTime();

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isLocked: true,
      isUrgent: false,
      isCritical: false,
      totalMs: 0,
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return {
    days,
    hours,
    minutes,
    seconds,
    isLocked: false,
    isUrgent: diff < 24 * 60 * 60 * 1000,
    isCritical: diff < 60 * 60 * 1000,
    totalMs: diff,
  };
}
