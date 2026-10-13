"use client";
import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { LineChart, BarChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useDemo, useVisible } from "@/providers/demo";
import {
  money,
  overdue,
  daysLate,
  currentInstallments,
  remaining,
} from "@/domain/finance";
echarts.use([
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  CanvasRenderer,
]);
export function CashChart({ mode = "cash" }: { mode?: "cash" | "mora" }) {
  const el = useRef<HTMLDivElement>(null);
  const { state, theme } = useDemo();
  const { loans, payments } = useVisible();
  useEffect(() => {
    if (!el.current) return;
    const style = getComputedStyle(document.documentElement);
    const color = (name: string) => style.getPropertyValue(name).trim();
    const chart = echarts.init(el.current);
    const today = state.business.today;
    const month = today.slice(0, 7);
    const points = Array.from(
      { length: Math.min(31, Number(today.slice(8, 10))) },
      (_, i) => {
        const date = `${month}-${String(i + 1).padStart(2, "0")}`;
        return (
          payments
            .filter((p) => p.date === date && p.source !== "credit")
            .reduce((sum, p) => sum + p.amount, 0) -
          payments
            .filter((p) => p.reversedOn === date && p.source !== "credit")
            .reduce((sum, p) => sum + p.amount, 0) -
          state.credits
            .filter(
              (c) =>
                c.date === date && loans.some((l) => l.clientId === c.clientId),
            )
            .reduce((sum, c) => sum + c.amount, 0)
        );
      },
    );
    const bands = [7, 30, 60, 90, Infinity];
    const mora = bands.map((max, index) =>
      loans
        .filter((l) => l.status === "activo")
        .flatMap(currentInstallments)
        .filter(
          (i) =>
            remaining(i) > 0 &&
            daysLate(i.due, today) > 0 &&
            daysLate(i.due, today) <= max &&
            daysLate(i.due, today) > (index ? bands[index - 1] : 0),
        )
        .reduce((sum, i) => sum + remaining(i), 0),
    );
    chart.setOption({
      animationDuration: 300,
      grid: { left: 64, right: 18, top: 16, bottom: 34 },
      tooltip: {
        trigger: "axis",
        backgroundColor: color("--surface"),
        borderColor: color("--line"),
        textStyle: { color: color("--text") },
        valueFormatter: (v: unknown) => money(Number(v)),
      },
      xAxis: {
        type: "category",
        boundaryGap: mode === "mora",
        data:
          mode === "cash"
            ? points.map((_, i) => String(i + 1).padStart(2, "0") + " oct")
            : ["1–7 días", "8–30", "31–60", "61–90", "90+"],
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: color("--muted"),
          fontFamily: "inherit",
          fontSize: 11,
          interval: mode === "cash" ? 2 : 0,
        },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          color: color("--muted"),
          fontSize: 11,
          formatter: (v: number) =>
            v >= 1000
              ? (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1) + "k"
              : String(v),
        },
        splitLine: { lineStyle: { color: color("--line"), type: "dashed" } },
        axisLine: { show: false },
      },
      series: [
        mode === "cash"
          ? {
              type: "line",
              data: points,
              smooth: 0.35,
              symbol: "circle",
              symbolSize: 6,
              showSymbol: false,
              lineStyle: { color: color("--accent"), width: 2.5 },
              itemStyle: { color: color("--accent") },
              areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: color("--accent-soft") },
                  { offset: 1, color: "transparent" },
                ]),
              },
            }
          : {
              type: "bar",
              data: mora,
              barWidth: 28,
              itemStyle: {
                color: color("--accent"),
                borderRadius: [5, 5, 0, 0],
              },
            },
      ],
    });
    const resize = new ResizeObserver(() => chart.resize());
    resize.observe(el.current);
    return () => {
      resize.disconnect();
      chart.dispose();
    };
  }, [state, theme, mode, loans.length, payments.length]);
  return (
    <div
      className="chart"
      ref={el}
      role="img"
      aria-label={
        mode === "cash"
          ? "Recaudación neta diaria del mes de presentación"
          : "Deuda vencida por antigüedad"
      }
    />
  );
}
