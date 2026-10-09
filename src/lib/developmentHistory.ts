import type { PlayerDevelopmentSnapshot } from "../store/types";

export function latestDevelopmentReview(history: PlayerDevelopmentSnapshot[] = []) {
  const valid = history.filter((review) => {
    const timestamp = Date.parse(review.date);
    return /^\d{4}-\d{2}-\d{2}$/.test(review.date) && Number.isFinite(timestamp)
      && new Date(timestamp).toISOString().slice(0, 10) === review.date
      && Number.isFinite(review.ovr) && review.ovr >= 0 && review.ovr <= 99;
  });
  return valid.reduce<PlayerDevelopmentSnapshot | undefined>(
    (latest, review) => !latest || review.date >= latest.date ? review : latest,
    undefined,
  );
}
