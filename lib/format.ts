import type { SeriesPoint } from "./types";

export function buildSeriesLabels(points: SeriesPoint[]): string[] {
  return points.map((point) => new Date(point.timestamp).toLocaleString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit"
  }));
}

export function buildSeriesDataset(points: SeriesPoint[]): number[] {
  return points.map((point) => point.messageCount);
}
