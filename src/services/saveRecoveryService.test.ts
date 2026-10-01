import { beforeEach, describe, expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { restoreSaveBackup } from "./saveRecoveryService";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

describe("restoreSaveBackup", () => {
  beforeEach(() => vi.clearAllMocks());
  it("requests recovery for the selected save only", async () => {
    vi.mocked(invoke).mockResolvedValue(undefined);
    await restoreSaveBackup("career-one");
    expect(invoke).toHaveBeenCalledWith("restore_save_backup", { saveId: "career-one" });
  });
  it("preserves recovery failures for the caller", async () => {
    vi.mocked(invoke).mockRejectedValue("be.error.saveLoad.corrupted");
    await expect(restoreSaveBackup("career-one")).rejects.toBe("be.error.saveLoad.corrupted");
  });
});
