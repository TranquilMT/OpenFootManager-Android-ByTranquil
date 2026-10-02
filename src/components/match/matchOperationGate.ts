/** One queue gate covers simulation steps and commands, including snapshot reads. */
export class MatchOperationGate {
  private busy = false;
  async run(operation: () => Promise<void>, onPending: (pending: boolean) => void) {
    if (this.busy) return;
    this.busy = true;
    onPending(true);
    try {
      await operation();
    } finally {
      this.busy = false;
      onPending(false);
    }
  }
}
