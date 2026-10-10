import { useCallback, useEffect, useRef, useState } from "react";

/** Follow the scroll container, while allowing the manager to read older events. */
export function useLiveFeedScroll(eventCount: number, enabled: boolean, streamKey = "all") {
  const feedRef = useRef<HTMLDivElement>(null);
  const [following, setFollowing] = useState(true);
  const previousCount = useRef(eventCount);
  useEffect(() => {
    if (eventCount < previousCount.current) setFollowing(true);
    previousCount.current = eventCount;
  }, [eventCount]);
  useEffect(() => {
    setFollowing(true);
  }, [streamKey]);
  const jumpToLive = useCallback(() => {
    const element = feedRef.current;
    if (element) element.scrollTop = element.scrollHeight;
    setFollowing(true);
  }, []);
  const onScroll = useCallback(() => {
    if (!enabled) return;
    const element = feedRef.current;
    if (element)
      setFollowing(element.scrollHeight - element.clientHeight - element.scrollTop <= 48);
  }, [enabled]);
  useEffect(() => {
    if (enabled && following) {
      const element = feedRef.current;
      if (element) element.scrollTop = element.scrollHeight;
    }
  }, [eventCount, enabled, following, streamKey]);
  return { feedRef, following, onScroll, jumpToLive };
}
