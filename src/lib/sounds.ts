import { Howl } from 'howler';

const sounds: Record<string, Howl> = {};

function getSound(name: string): Howl {
  if (!sounds[name]) {
    sounds[name] = new Howl({
      src: [`/sounds/${name}.mp3`],
      volume: 0.3,
      preload: true,
    });
  }
  return sounds[name];
}

function shouldPlay(): boolean {
  // Check localStorage directly for instant check without store dependency
  try {
    const stored = JSON.parse(localStorage.getItem('mns-app-settings') || '{}');
    if (stored?.state?.soundsMuted) return false;
  } catch {
    // Proceed if localStorage is unavailable
  }

  // Respect prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;

  return true;
}

export function playClick() {
  if (shouldPlay()) getSound('click').play();
}

export function playSuccess() {
  if (shouldPlay()) getSound('success').play();
}

export function playDing() {
  if (shouldPlay()) getSound('ding').play();
}

export function playElimination() {
  if (shouldPlay()) getSound('elimination').play();
}

export function playTick() {
  if (shouldPlay()) getSound('tick').play();
}
