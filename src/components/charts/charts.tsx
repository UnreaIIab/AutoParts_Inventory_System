"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
);

// Odoo-inspired chart palette
const PURPLE = "#714b67";
const PURPLE_SOFT = "rgba(113, 75, 103, 0.12)";
const PALETTE = [
  "#714b67",
  "#2f80ed",
  "#0f9d58",
  "#e0a800",
  "#d64545",
  "#8e5ea2",
  "#3cba9f",
  "#e8823a",
];

const baseGrid = {
  color: "#eef0f3",
  drawBorder: false,
};

const baseTicks = {
  color: "#9aa0a8",
  font: { size: 11 },
};

interface SeriesData {
  labels: string[];
  values: number[];
}

export function SalesLineChart({ labels, values }: SeriesData) {
  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: baseTicks },
      y: { grid: baseGrid, ticks: baseTicks, beginAtZero: true },
    },
  };
  return (
    <Line
      options={options}
      data={{
        labels,
        datasets: [
          {
            data: values,
            borderColor: PURPLE,
            backgroundColor: PURPLE_SOFT,
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            pointHoverRadius: 4,
            borderWidth: 2,
          },
        ],
      }}
    />
  );
}

export function PurchasesBarChart({ labels, values }: SeriesData) {
  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: baseTicks },
      y: { grid: baseGrid, ticks: baseTicks, beginAtZero: true },
    },
  };
  return (
    <Bar
      options={options}
      data={{
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: "#2f80ed",
            borderRadius: 4,
            maxBarThickness: 28,
          },
        ],
      }}
    />
  );
}

export function CategoryDoughnut({ labels, values }: SeriesData) {
  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      legend: {
        position: "right",
        labels: {
          color: "#6b6f76",
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          font: { size: 12 },
          padding: 12,
        },
      },
    },
  };
  return (
    <Doughnut
      options={options}
      data={{
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: PALETTE,
            borderWidth: 0,
            spacing: 2,
          },
        ],
      }}
    />
  );
}

export function BestSellersBar({ labels, values }: SeriesData) {
  const options: ChartOptions<"bar"> = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: baseGrid, ticks: baseTicks, beginAtZero: true },
      y: { grid: { display: false }, ticks: baseTicks },
    },
  };
  return (
    <Bar
      options={options}
      data={{
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: "#714b67",
            borderRadius: 4,
            maxBarThickness: 18,
          },
        ],
      }}
    />
  );
}
