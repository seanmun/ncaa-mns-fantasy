// Resend email client — server-side only
// PLATFORM PATTERN — single sending domain mnsfantasy.com for all game apps

import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'updates@mnsfantasy.com';
