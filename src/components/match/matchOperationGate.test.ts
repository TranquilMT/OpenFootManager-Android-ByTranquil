import { describe, expect, it, vi } from "vitest";
import { MatchOperationGate } from "./matchOperationGate";

describe("match operation gate", () => {
  it("reports skipped ticks and completed operations explicitly", async () => {
    const gate = new MatchOperationGate();
    let finish: () => void = () => {};
    const step = gate.run(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
      vi.fn(),
    );
    expect(await gate.run(vi.fn(), vi.fn())).toBe("busy");
    finish();
    expect(await step).toBe("completed");
  });
  it("queues user commands behind a running step without dropping them", async () => {
    const gate = new MatchOperationGate();
    const order: string[] = [];
    let finish: () => void = () => {};
    const step = gate.run(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
      vi.fn(),
    );
    const command = gate.runCommand(async () => {
      order.push("command");
    }, vi.fn());
    expect(order).toEqual([]);
    expect(
      await gate.run(async () => {
        order.push("tick");
      }, vi.fn()),
    ).toBe("busy");
    finish();
    await Promise.all([step, command]);
    expect(order).toEqual(["command"]);
  });
  it("preserves command order and continues after a rejected command", async () => {
    const gate = new MatchOperationGate();
    const first = gate.runCommand(async () => {
      throw new Error("rejected");
    }, vi.fn());
    const second = vi.fn(async () => {});
    const next = gate.runCommand(second, vi.fn());
    await expect(first).rejects.toThrow("rejected");
    await next;
    expect(second).toHaveBeenCalledOnce();
  });
  it("prevents commands and steps from overwriting each other's delayed snapshots", async () => {
    const gate = new MatchOperationGate();
    const pending = vi.fn();
    let finish: () => void = () => {};
    const delayed = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const command = vi.fn(async () => {});
    const step = gate.run(() => delayed, pending);
    await gate.run(command, pending);
    expect(command).not.toHaveBeenCalled();
    finish();
    await step;
    await gate.run(command, pending);
    expect(command).toHaveBeenCalledOnce();
    expect(pending.mock.calls.map(([value]) => value)).toEqual([true, false, true, false]);
  });
  it("releases the gate after a failed backend request", async () => {
    const gate = new MatchOperationGate();
    await expect(
      gate.run(async () => {
        throw new Error("backend");
      }, vi.fn()),
    ).rejects.toThrow("backend");
    const next = vi.fn(async () => {});
    await gate.run(next, vi.fn());
    expect(next).toHaveBeenCalledOnce();
  });
});
