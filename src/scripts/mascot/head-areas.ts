import type { AssetId } from "./assets.ts";

/**
 * Where Mr. Fresh's head is in each pose, as fractions of that pose's image:
 * [left, top, right, bottom], covering ears to chin. A click inside the box pets him.
 * Estimated by eye. If a pose feels hard to hit, widen or shift its box.
 */
export const headAreas: Record<
  AssetId,
  readonly [number, number, number, number]
> = {
  base: [0.4, 0.03, 0.93, 0.41],
  "judgmental-side-eye": [0.26, 0.02, 0.97, 0.6],
  "neutral-relaxed": [0.25, 0.02, 0.97, 0.6],
  curious: [0.34, 0.02, 0.97, 0.58],
  "happy-content": [0.3, 0.02, 0.96, 0.58],
  annoyed: [0.26, 0.05, 0.98, 0.6],
  surprised: [0.26, 0.01, 0.97, 0.64],
  sleepy: [0.28, 0.04, 0.98, 0.6],
  yawning: [0.26, 0.03, 0.96, 0.68],
  smug: [0.28, 0.02, 0.98, 0.6],
  confused: [0.26, 0.04, 0.98, 0.6],
  dizzy: [0.26, 0.02, 0.97, 0.64],
  "default-sitting": [0.46, 0.04, 0.93, 0.46],
  "curious-lean": [0.44, 0.03, 0.98, 0.46],
  peeking: [0.3, 0.05, 0.98, 0.66],
  walking: [0.54, 0.01, 0.92, 0.4],
  "sleeping-curl": [0.62, 0.12, 0.99, 0.76],
  jumping: [0.48, 0.0, 0.92, 0.42],
  "falling-tossed": [0.52, 0.02, 0.97, 0.54],
  stretching: [0.62, 0.24, 0.98, 0.66],
  "paw-swipe": [0.04, 0.03, 0.52, 0.4],
  "sitting-in-container": [0.46, 0.03, 0.94, 0.45],
};
