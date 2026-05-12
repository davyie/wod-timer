import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioService {
  private ctx: AudioContext | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  private tone(frequency: number, durationMs: number, delayMs = 0, gain = 0.3): void {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = frequency;
    const t = ctx.currentTime + delayMs / 1000;
    gainNode.gain.setValueAtTime(gain, t);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + durationMs / 1000);
    osc.start(t);
    osc.stop(t + durationMs / 1000);
  }

  // Two short pips then one long pip — played when timer starts
  playStart(): void {
    this.tone(880, 100, 0);
    this.tone(880, 100, 200);
    this.tone(1100, 300, 400);
  }

  // Three pips — played when timer auto-finishes
  playFinish(): void {
    this.tone(880, 150, 0);
    this.tone(880, 150, 250);
    this.tone(880, 500, 500);
  }

  // Single pip — played on manual stop or EMOM round change
  playPip(): void {
    this.tone(660, 150);
  }

  // Short low pip — played for 3-2-1 countdown before end
  playCountdownPip(): void {
    this.tone(440, 80);
  }
}
