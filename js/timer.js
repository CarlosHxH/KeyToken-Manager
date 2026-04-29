export class Timer {
  constructor(onTick, onExpire) {
    this.onTick = onTick;
    this.onExpire = onExpire;
    this.interval = null;
    this.expiresAt = null;
    this.totalSeconds = 0;
  }

  start(expiresAtMs, totalSeconds) {
    this.clear();
    this.expiresAt = expiresAtMs;
    this.totalSeconds = totalSeconds || 300;
    this._tick();
    this.interval = setInterval(() => this._tick(), 1000);
  }

  clear() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  _tick() {
    const remaining = Math.max(0, Math.floor((this.expiresAt - Date.now()) / 1000));
    const pct = Math.max(0, (remaining / this.totalSeconds) * 100);

    if (remaining <= 0) {
      this.clear();
      this.onExpire();
      return;
    }

    this.onTick(remaining, pct);
  }
}
