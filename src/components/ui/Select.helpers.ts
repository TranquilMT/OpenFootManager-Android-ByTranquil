interface Viewport { top: number; left: number; width: number; height: number }
interface Trigger { top: number; bottom: number; left: number; width: number }
export function placeSelectMenu(trigger: Trigger, viewport: Viewport, naturalHeight: number, naturalWidth: number, chrome: number) {
  const margin = 8;
  const gap = 4;
  const above = Math.max(0, trigger.top - gap - viewport.top - margin);
  const below = Math.max(0, viewport.top + viewport.height - margin - trigger.bottom - gap);
  const openUp = naturalHeight > below && above > below;
  const height = Math.max(0, Math.min(naturalHeight, openUp ? above : below, viewport.height - margin * 2));
  const width = Math.max(0, Math.min(Math.max(trigger.width, naturalWidth), viewport.width - margin * 2));
  return {
    top: Math.max(viewport.top + margin, Math.min(openUp ? trigger.top - gap - height : trigger.bottom + gap, viewport.top + viewport.height - margin - height)),
    left: Math.max(viewport.left + margin, Math.min(trigger.left, viewport.left + viewport.width - margin - width)),
    width,
    listHeight: Math.max(0, height - chrome),
  };
}
