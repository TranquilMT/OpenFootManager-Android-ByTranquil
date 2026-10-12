import { useEffect } from "react";
let owners = 0;
let previous = "";
export function useReplayScrollLock() {
  useEffect(() => {
    if (owners++ === 0) {
      previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    return () => {
      if (--owners === 0) document.body.style.overflow = previous;
    };
  }, []);
}
