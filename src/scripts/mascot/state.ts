export type State = 'entering' | 'idle' | 'curious' | 'reacting' | 'petting' | 'dragging' | 'airborne' | 'bouncing' | 'settling' | 'returning' | 'sleepy' | 'yawning' | 'sleeping' | 'waking' | 'section-transitioning';
export interface Clock { now(): number; set(callback: () => void, delay: number): number; clear(id: number): void; }
export const browserClock: Clock = { now: () => performance.now(), set: (fn, ms) => globalThis.setTimeout(fn, ms) as unknown as number, clear: id => globalThis.clearTimeout(id) };
const priority: Record<State, number> = { dragging: 6, airborne: 5, bouncing: 5, settling: 5, returning: 5, 'section-transitioning': 4, entering: 4, reacting: 3, petting: 3, sleepy: 2, yawning: 2, sleeping: 2, waking: 2, curious: 1, idle: 0 };
const edges: Partial<Record<State, readonly State[]>> = { dragging: ['airborne','returning'], airborne: ['bouncing','settling','returning'], bouncing: ['airborne','bouncing','settling','returning'], settling: ['returning'], returning: ['idle'] };
const physical = new Set<State>(['airborne','bouncing','settling','returning']);
/** Each operation owns an epoch and its timers. Completion can never revive an old operation. */
export class StateMachine {
  state: State = 'idle';
  private epoch = 0;
  private timers = new Set<number>();
  private destroyed = false;
  private clock: Clock;
  constructor(clock: Clock = browserClock) { this.clock = clock; }
  start(next: State): number | null {
    if (this.destroyed || physical.has(next) || priority[next] < priority[this.state]) return null;
    this.cancel(next);
    return this.epoch;
  }
  valid(key: number): boolean { return !this.destroyed && key === this.epoch; }
  advance(key: number, next: State): boolean {
    if (!this.valid(key)) return false;
    if (edges[this.state] && !edges[this.state]?.includes(next)) return false;
    if (!edges[this.state] && physical.has(next)) return false;
    this.state = next;
    return true;
  }
  after(key: number, delay: number, fn: () => void): void {
    if (!this.valid(key)) return;
    const id = this.clock.set(() => { this.timers.delete(id); if (this.valid(key)) fn(); }, delay);
    this.timers.add(id);
  }
  finish(key: number): boolean { if (!this.valid(key)) return false; this.cancel(); return true; }
  cancel(next: State = 'idle'): void { this.epoch++; for (const id of this.timers) this.clock.clear(id); this.timers.clear(); this.state = next; }
  destroy(): void { this.cancel(); this.destroyed = true; }
}
