import { describe, expect, it } from "vitest";

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) {
    return 0;
  }
  const index = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
  return sorted[index] ?? 0;
}

function summarizePublishLatencies(durationsMs: number[]) {
  const sorted = [...durationsMs].sort((a, b) => a - b);
  return {
    count: sorted.length,
    p50Ms: percentile(sorted, 0.5),
    p95Ms: percentile(sorted, 0.95),
    maxMs: sorted[sorted.length - 1] ?? 0,
  };
}

describe("publish latency perf harness", () => {
  it("computes p50/p95 for publish durations", () => {
    const samples = [12, 18, 25, 40, 55, 80, 120, 150, 180, 220];
    const summary = summarizePublishLatencies(samples);

    expect(summary.count).toBe(10);
    expect(summary.p50Ms).toBe(80);
    expect(summary.p95Ms).toBe(220);
    expect(summary.maxMs).toBe(220);
  });

  it("documents target threshold for staging-like measurements", () => {
    const TARGET_MS = 200;
    const stagingSamples = [8, 15, 22, 35, 48, 62, 75, 90, 110, 130];
    const summary = summarizePublishLatencies(stagingSamples);

    expect(summary.p50Ms).toBeLessThan(TARGET_MS);
    expect(summary.p95Ms).toBeLessThan(TARGET_MS);
  });

  it("simulates publish→subscription update latency measurement", async () => {
    const iterations = 20;
    const latencies: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const started = performance.now();
      await Promise.resolve();
      latencies.push(Math.round(performance.now() - started));
    }

    const summary = summarizePublishLatencies(latencies);
    expect(summary.count).toBe(iterations);
    expect(summary.p95Ms).toBeGreaterThanOrEqual(summary.p50Ms);
  });
});
