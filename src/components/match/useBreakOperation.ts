import { useEffect, useRef, useState } from "react";

/** A synchronous lock also rejects double taps in the same render frame. */
export function useBreakOperation() {
  const lock = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const isActive = () => mounted.current;
  const [pending, setPending] = useState(false);
  const run = async (task: () => Promise<void>): Promise<boolean> => {
    if (lock.current || !mounted.current) return false;
    lock.current = true;
    setPending(true);
    try {
      await task();
      return mounted.current;
    } finally {
      lock.current = false;
      if (mounted.current) setPending(false);
    }
  };
  return { pending, run, isActive, isPending: () => lock.current };
}
