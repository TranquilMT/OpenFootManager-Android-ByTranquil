/** One queue gate covers simulation steps and commands, including snapshot reads. */
export class MatchOperationGate {
  private busy = false;
  private queuedCommands = 0;
  private tail: Promise<unknown> = Promise.resolve();

  run(operation: () => Promise<void>, onPending: (pending: boolean) => void) {
    if (this.busy || this.queuedCommands > 0) return Promise.resolve("busy" as const);
    const task = this.execute(operation, onPending);
    this.tail = task.catch(() => {});
    return task;
  }

  /** User decisions wait for the current snapshot; timer ticks never build a backlog. */
  runCommand(operation: () => Promise<void>, onPending: (pending: boolean) => void) {
    this.queuedCommands += 1;
    const task = this.tail.then(() => this.execute(operation, onPending));
    this.tail = task.catch(() => {});
    return task.finally(() => {
      this.queuedCommands -= 1;
    });
  }

  private async execute(operation: () => Promise<void>, onPending: (pending: boolean) => void) {
    this.busy = true;
    try {
      onPending(true);
      await operation();
      return "completed" as const;
    } finally {
      this.busy = false;
      onPending(false);
    }
  }
}
