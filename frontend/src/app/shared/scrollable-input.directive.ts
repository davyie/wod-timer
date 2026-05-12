import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: 'input[type="number"]',
  standalone: true,
})
export class ScrollableInputDirective {
  constructor(private readonly el: ElementRef<HTMLInputElement>) {}

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const input = this.el.nativeElement;
    const step = Number(input.step) || 1;
    const min = input.min !== '' ? Number(input.min) : -Infinity;
    const max = input.max !== '' ? Number(input.max) : Infinity;
    const current = Number(input.value) || 0;
    const next = Math.min(max, Math.max(min, current + (event.deltaY < 0 ? step : -step)));
    input.value = String(next);
    input.dispatchEvent(new Event('input'));
  }
}
