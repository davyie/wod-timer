import { Routes } from '@angular/router';
import { TimerComponent } from './timer/timer';
import { HistoryComponent } from './history/history';

export const routes: Routes = [
  { path: '', component: TimerComponent },
  { path: 'history', component: HistoryComponent },
  { path: '**', redirectTo: '' }
];
