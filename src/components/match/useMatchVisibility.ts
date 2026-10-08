import { useEffect, useState } from "react";

/** Background timers cannot advance a managed match without its visible decision controls. */
export function useMatchVisibility() {
  const [visible, setVisible] = useState(() => !document.hidden);
  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);
  return visible;
}
