import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SessionService } from '../core/services/session';
import { AudioService } from '../core/services/audio';
import { WakeLockService } from '../core/services/wake-lock';
import { ScrollableInputDirective } from '../shared/scrollable-input.directive';

type TimerType = 'stopwatch' | 'amrap' | 'emom' | 'for-time';

@Component({
  selector: 'app-timer',
  imports: [FormsModule, ScrollableInputDirective],
  templateUrl: './timer.html',
  styleUrl: './timer.scss',
})
export class TimerComponent implements OnDestroy {
  private readonly sessionService = inject(SessionService);
  private readonly audioService = inject(AudioService);
  private readonly wakeLockService = inject(WakeLockService);

  timerType = signal<TimerType>('stopwatch');
  amrapMinutes = signal(10);
  emomRounds = signal(10);
  emomRoundMinutes = signal(1);
  emomRoundSeconds = signal(0);
  forTimeCapMinutes = signal(0);

  elapsedMs = signal(0);
  running = signal(false);
  saved = signal(false);
  finished = signal(false);
  label = signal('');
  countingDown = signal(false);
  countdownValue = signal(0);

  private startTime = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private countdownId: ReturnType<typeof setInterval> | null = null;
  private prevRoundIndex = 0;
  private lastPipSecond = -1;

  emomRoundMs = computed(() => this.emomRoundMinutes() * 60000 + this.emomRoundSeconds() * 1000);

  currentRound = computed(() =>
    Math.min(Math.floor(this.elapsedMs() / this.emomRoundMs()) + 1, this.emomRounds())
  );

  roundRemainingMs = computed(() => this.emomRoundMs() - (this.elapsedMs() % this.emomRoundMs()));

  amrapRemainingMs = computed(() =>
    Math.max(0, this.amrapMinutes() * 60000 - this.elapsedMs())
  );

  configValid = computed(() => {
    const type = this.timerType();
    if (type === 'amrap') return this.amrapMinutes() > 0;
    if (type === 'emom') return this.emomRounds() > 0 && this.emomRoundMs() > 0;
    return true;
  });

  get displayTime(): string {
    const type = this.timerType();
    if (type === 'amrap') return formatCountdown(this.amrapRemainingMs());
    if (type === 'emom') return formatCountdown(this.roundRemainingMs());
    return formatElapsed(this.elapsedMs());
  }

  selectType(type: TimerType): void {
    if (this.running()) return;
    this.timerType.set(type);
    this.reset();
  }

  start(): void {
    if (this.running() || this.finished() || this.countingDown()) return;
    this.countingDown.set(true);
    this.countdownValue.set(10);
    this.audioService.playCountdownPip();
    this.wakeLockService.acquire();
    this.countdownId = setInterval(() => {
      const next = this.countdownValue() - 1;
      if (next <= 0) {
        clearInterval(this.countdownId!);
        this.countdownId = null;
        this.countingDown.set(false);
        this.startTimer();
      } else {
        this.countdownValue.set(next);
        this.audioService.playCountdownPip();
      }
    }, 1000);
  }

  private startTimer(): void {
    this.startTime = Date.now() - this.elapsedMs();
    this.running.set(true);
    this.saved.set(false);
    this.prevRoundIndex = 0;
    this.lastPipSecond = -1;
    this.audioService.playStart();
    this.intervalId = setInterval(() => {
      const elapsed = Date.now() - this.startTime;
      this.elapsedMs.set(elapsed);
      this.checkSounds(elapsed);
      this.checkAutoFinish(elapsed);
    }, 10);
  }

  private checkSounds(elapsed: number): void {
    const type = this.timerType();
    if (type === 'emom') {
      const roundMs = this.emomRoundMs();
      const roundIndex = Math.floor(elapsed / roundMs);
      if (roundIndex > this.prevRoundIndex) {
        this.prevRoundIndex = roundIndex;
        this.lastPipSecond = -1;
        if (roundIndex < this.emomRounds()) {
          this.audioService.playPip();
        }
      }
      const sec = Math.ceil((roundMs - (elapsed % roundMs)) / 1000);
      if (sec <= 3 && sec > 0 && sec !== this.lastPipSecond) {
        this.lastPipSecond = sec;
        this.audioService.playCountdownPip();
      }
    } else if (type === 'amrap') {
      const sec = Math.ceil(Math.max(0, this.amrapMinutes() * 60000 - elapsed) / 1000);
      if (sec <= 3 && sec > 0 && sec !== this.lastPipSecond) {
        this.lastPipSecond = sec;
        this.audioService.playCountdownPip();
      }
    } else if (type === 'for-time') {
      const capMs = this.forTimeCapMinutes() * 60000;
      if (capMs > 0) {
        const sec = Math.ceil(Math.max(0, capMs - elapsed) / 1000);
        if (sec <= 3 && sec > 0 && sec !== this.lastPipSecond) {
          this.lastPipSecond = sec;
          this.audioService.playCountdownPip();
        }
      }
    }
  }

  private checkAutoFinish(elapsed: number): void {
    const type = this.timerType();
    if (type === 'amrap' && elapsed >= this.amrapMinutes() * 60000) {
      this.elapsedMs.set(this.amrapMinutes() * 60000);
      this.finishAuto();
    } else if (type === 'emom' && elapsed >= this.emomRounds() * this.emomRoundMs()) {
      this.elapsedMs.set(this.emomRounds() * this.emomRoundMs());
      this.finishAuto();
    } else {
      const capMs = this.forTimeCapMinutes() * 60000;
      if (type === 'for-time' && capMs > 0 && elapsed >= capMs) {
        this.elapsedMs.set(capMs);
        this.finishAuto();
      }
    }
  }

  private finishAuto(): void {
    clearInterval(this.intervalId!);
    this.intervalId = null;
    this.running.set(false);
    this.finished.set(true);
    this.audioService.playFinish();
    this.wakeLockService.release();
  }

  stop(): void {
    if (!this.running()) return;
    clearInterval(this.intervalId!);
    this.intervalId = null;
    this.running.set(false);
    this.audioService.playPip();
    this.wakeLockService.release();
  }

  reset(): void {
    if (this.countingDown()) {
      clearInterval(this.countdownId!);
      this.countdownId = null;
      this.countingDown.set(false);
      this.wakeLockService.release();
    }
    if (this.running()) {
      clearInterval(this.intervalId!);
      this.intervalId = null;
      this.running.set(false);
      this.wakeLockService.release();
    }
    this.elapsedMs.set(0);
    this.saved.set(false);
    this.finished.set(false);
    this.label.set('');
    this.prevRoundIndex = 0;
    this.lastPipSecond = -1;
  }

  save(): void {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - this.elapsedMs());
    this.sessionService
      .saveSession({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        elapsedMs: this.elapsedMs(),
        label: this.label() || 'Unnamed session',
        timerType: this.timerType().toUpperCase().replace('-', '_'),
      })
      .subscribe({
        next: () => this.saved.set(true),
        error: (err) => console.error('Failed to save session', err),
      });
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.countdownId) clearInterval(this.countdownId);
  }
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, ms);
  const s = Math.floor((total / 1000) % 60);
  const m = Math.floor(total / 60000);
  return `${pad(m)}:${pad(s)}`;
}

function formatElapsed(ms: number): string {
  const cs = Math.floor((ms % 1000) / 10);
  const s = Math.floor((ms / 1000) % 60);
  const m = Math.floor((ms / 60000) % 60);
  const h = Math.floor(ms / 3600000);
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(cs)}`;
  return `${pad(m)}:${pad(s)}.${pad(cs)}`;
}
