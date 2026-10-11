import { useRef, useState } from "react";

/** A synchronous lock also rejects double taps in the same render frame. */
export function useBreakOperation() {
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const run = async (task: () => Promise<void>): Promise<boolean> => {
    if (lock.current) return false;
    lock.current = true;
    setPending(true);
    try {
      await task();
      return true;
    } finally {
      lock.current = false;
      setPending(false);
    }
  };
  return { pending, run };
}
