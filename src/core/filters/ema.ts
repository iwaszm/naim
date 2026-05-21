export class ExponentialMovingAverage {
  private value: number | null = null;

  constructor(private readonly alpha = 0.35) {}

  next(input: number): number {
    if (this.value === null) {
      this.value = input;
      return input;
    }
    this.value = this.alpha * input + (1 - this.alpha) * this.value;
    return this.value;
  }

  reset(): void {
    this.value = null;
  }
}

export class EmaBank {
  private filters = new Map<string, ExponentialMovingAverage>();

  constructor(private readonly alpha = 0.35) {}

  next(key: string, input: number): number {
    if (!this.filters.has(key)) {
      this.filters.set(key, new ExponentialMovingAverage(this.alpha));
    }
    return this.filters.get(key)!.next(input);
  }

  reset(): void {
    this.filters.clear();
  }
}
