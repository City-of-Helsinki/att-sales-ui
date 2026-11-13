/**
 * Dev-only observability for the project list initial load.
 * Counts `projects/?page=` network requests since `since` (Resource Timing) and logs
 * TTFB of the first request and time until the first content is available.
 */
export const logProjectsLoadMetrics = (since: number): void => {
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') return;
  if (typeof performance === 'undefined' || typeof performance.getEntriesByType !== 'function') return;

  const entries = (performance.getEntriesByType('resource') as PerformanceResourceTiming[]).filter(
    (e) => e.name.includes('/projects/?page=') && e.startTime >= since
  );
  const first = entries.find((e) => e.name.includes('page=1&'));
  // responseStart/requestStart are 0 for cross-origin responses without Timing-Allow-Origin
  const ttfb = first && first.responseStart > 0 ? Math.round(first.responseStart - first.requestStart) : undefined;
  const firstContent = Math.round(performance.now() - since);

  // eslint-disable-next-line no-console
  console.info(
    `[projects] initial load: requests=${entries.length}, ttfb=${ttfb ?? 'n/a'}ms, firstContent=${firstContent}ms`
  );
};
