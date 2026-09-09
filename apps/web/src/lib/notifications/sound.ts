"use client";

const NOTIFICATION_SOUND_PATH = "/sounds/notification.mp3";

let audio: HTMLAudioElement | null = null;
let soundEnabled = false;

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(NOTIFICATION_SOUND_PATH);
    audio.preload = "auto";
    audio.volume = 0.55;
  }

  return audio;
}

/**
 * Browsers may block audio until the user has interacted with the page.
 * This attempts to unlock the notification audio during a real user gesture.
 */
export function unlockNotificationSound(): void {
  if (typeof window === "undefined") {
    return;
  }

  const player = getAudio();

  player
    .play()
    .then(() => {
      player.pause();
      player.currentTime = 0;
      soundEnabled = true;
    })
    .catch(() => {
      // Browser autoplay policy may block this.
      // A later user gesture can try again.
    });
}

/**
 * Plays the notification sound once.
 *
 * Returns false when the browser blocks playback.
 */
export async function playNotificationSound(): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  const player = getAudio();

  try {
    if (!soundEnabled) {
      await player.play();
      soundEnabled = true;
      return true;
    }

    player.currentTime = 0;
    await player.play();
    return true;
  } catch {
    return false;
  }
}