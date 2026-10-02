import { describe, expect, it, vi } from "vitest";
import { MatchOperationGate } from "./matchOperationGate";

describe("match operation gate", () => {
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
