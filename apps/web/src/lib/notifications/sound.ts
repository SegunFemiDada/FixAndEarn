"use client";

const NOTIFICATION_SOUND_PATH = "/sounds/notification.mp3";

let audio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(NOTIFICATION_SOUND_PATH);
    audio.preload = "auto";
    audio.volume = 0.55;
  }

  return audio;
}

/**
 * Preloads the notification audio after a real user interaction.
 * This does not play the notification sound.
 */
export function unlockNotificationSound(): void {
  if (typeof window === "undefined") {
    return;
  }

  getAudio().load();
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
    player.currentTime = 0;
    await player.play();
    return true;
  } catch {
    return false;
  }
}