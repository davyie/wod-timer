import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SessionService, TimerSession } from '../core/services/session';

@Component({
  selector: 'app-history',
  imports: [DatePipe],
  templateUrl: './history.html',
  styleUrl: './history.scss',
})
export class HistoryComponent implements OnInit {
  private readonly sessionService = inject(SessionService);

  sessions = signal<TimerSession[]>([]);
  loading = signal(true);
  error = signal('');

  ngOnInit(): void {
    this.sessionService.getSessions().subscribe({
      next: (data) => {
        this.sessions.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load sessions. Is the backend running?');
        this.loading.set(false);
        console.error(err);
      },
    });
  }

  formatElapsed(ms: number): string {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    return `${pad(h)}:${pad(m % 60)}:${pad(s % 60)}`;
  }

  formatType(type: string | undefined): string {
    const map: Record<string, string> = {
      STOPWATCH: 'Stopwatch',
      AMRAP: 'AMRAP',
      EMOM: 'EMOM',
      FOR_TIME: 'For Time',
    };
    return type ? (map[type] ?? type) : '—';
  }
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}
