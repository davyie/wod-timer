import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WakeLockService {
  private wakeLock: WakeLockSentinel | null = null;
  private active = false;

  async acquire(): Promise<void> {
    if (!('wakeLock' in navigator) || this.active) return;
    this.active = true;
    await this.requestLock();
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  async release(): Promise<void> {
    if (!this.active) return;
    this.active = false;
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    if (this.wakeLock) {
      await this.wakeLock.release();
      this.wakeLock = null;
    }
  }

  // Re-acquire after returning to the tab — the OS releases the lock on hide
  private readonly onVisibilityChange = async (): Promise<void> => {
    if (document.visibilityState === 'visible' && this.active) {
      await this.requestLock();
    }
  };

  private async requestLock(): Promise<void> {
    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
    } catch {
      // Silently ignore — fails in battery saver mode or unsupported browsers
    }
  }
}
