import { invoke } from "@tauri-apps/api/core";

export function restoreSaveBackup(saveId: string): Promise<void> {
  return invoke<void>("restore_save_backup", { saveId });
}
