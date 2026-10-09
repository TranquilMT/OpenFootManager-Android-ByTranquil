import type { PlayerDevelopmentSnapshot } from "../store/types";

export function latestDevelopmentReview(history: PlayerDevelopmentSnapshot[] = []) {
  return history.reduce<PlayerDevelopmentSnapshot | undefined>(
    (latest, review) => !latest || review.date >= latest.date ? review : latest,
    undefined,
  );
}
