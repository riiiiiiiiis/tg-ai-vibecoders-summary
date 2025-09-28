'use client';

import { useEffect, useRef } from "react";
import { Chart, type ChartConfiguration } from "chart.js/auto";
import type { SeriesPoint } from "@/lib/types";
import { buildSeriesDataset, buildSeriesLabels } from "@/lib/format";

type TimeSeriesChartProps = {
  series: SeriesPoint[];
  windowLabel: string;
};

export function TimeSeriesChart({ series, windowLabel }: TimeSeriesChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const labels = buildSeriesLabels(series);
    const data = buildSeriesDataset(series);

    const config: ChartConfiguration = {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Сообщения",
            data,
            borderColor: "#38bdf8",
            backgroundColor: "rgba(56, 189, 248, 0.15)",
            tension: 0.35,
            fill: true,
            pointRadius: 2,
            pointHoverRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            intersect: false,
            mode: "index"
          },
          title: {
            display: true,
            text: windowLabel,
            color: "#cbd5f5",
            font: { size: 14, weight: 500 }
          }
        },
        scales: {
          x: {
            ticks: { color: "#94a3b8", maxRotation: 0 },
            grid: { color: "rgba(148, 163, 184, 0.1)" }
          },
          y: {
            ticks: { color: "#94a3b8" },
            grid: { color: "rgba(148, 163, 184, 0.08)" }
          }
        }
      }
    };

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(canvasRef.current, config);

    return () => {
      chartRef.current?.destroy();
    };
  }, [series, windowLabel]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <canvas ref={canvasRef} />
    </div>
  );
}
