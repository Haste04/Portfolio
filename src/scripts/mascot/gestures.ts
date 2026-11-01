export interface Sample { x: number; y: number; t: number; }
export class ClickTracker {
  private times: number[] = [];
  private cooldown = -Infinity;
  click(now: number): 'surprised' | 'annoyed' | 'paw-swipe' | null {
    if (now < this.cooldown) return null;
    this.times = this.times.filter(t => now - t < 2000);
    this.times.push(now);
    if (this.times.length >= 5) { this.times = []; this.cooldown = now + 1500; return 'paw-swipe'; }
    return this.times.length >= 3 ? 'annoyed' : 'surprised';
  }
}
export class DragTracker {
  samples: Sample[] = [];
  private first: Sample | null = null;
  private type = '';
  private moved = false;
  begin(x: number, y: number, t: number, type: string): void { this.first = {x,y,t}; this.samples = [this.first]; this.type = type; this.moved = false; }
  move(x: number, y: number, t: number): 'pending' | 'dragging' | 'scrolling' {
    if (!this.first) return 'pending';
    this.samples.push({x,y,t}); this.samples = this.samples.filter(s => t-s.t <= 140);
    this.moved ||= Math.hypot(x-this.first.x,y-this.first.y) > 8;
    return this.moved ? this.type === 'touch' ? 'scrolling' : 'dragging' : 'pending';
  }
  end(): {click: boolean; samples: Sample[]} { const result = {click: !!this.first && !this.moved, samples: this.samples}; this.first = null; return result; }
}
export class PetRecognizer {
  private previous: Sample | null = null;
  private direction = 0;
  private travel = 0;
  private total = 0;
  private reversals = 0;
  private started = 0;
  reset(): void { this.previous = null; this.direction = this.travel = this.total = this.reversals = 0; }
  move(x: number, y: number, t: number, inside: boolean): boolean {
    if (!inside) { this.reset(); return false; }
    const p = this.previous;
    if (!p || t-this.started > 2000) { this.reset(); this.started=t; this.previous={x,y,t}; return false; }
    this.previous={x,y,t};
    const dx=x-p.x, dy=y-p.y, distance=Math.hypot(dx,dy), dt=t-p.t;
    if (dt <= 0 || distance/dt > 1.8 || Math.abs(dy)>Math.abs(dx)*2+6) { this.reset(); return false; }
    if (Math.abs(dx)<2) return false;
    const direction=Math.sign(dx);
    if (this.direction && direction!==this.direction) {
      if (this.travel>=28) this.reversals++;
      this.travel=0;
    }
    this.direction=direction; this.travel+=Math.abs(dx); this.total+=distance;
    if (this.reversals>=2 && this.travel>=28 && this.total>=140) { this.reset(); return true; }
    return false;
  }
}
