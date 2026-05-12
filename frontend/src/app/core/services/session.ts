import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TimerSession {
  id?: string;
  sessionId?: string;
  startTime: string;
  endTime: string;
  elapsedMs: number;
  label: string;
  timerType?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/sessions';

  getSessions(): Observable<TimerSession[]> {
    return this.http.get<TimerSession[]>(this.apiUrl);
  }

  saveSession(session: TimerSession): Observable<TimerSession> {
    return this.http.post<TimerSession>(this.apiUrl, session);
  }
}
