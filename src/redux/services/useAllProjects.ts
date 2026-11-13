import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useLazyGetProjectsQuery } from './api';
import { Project } from '../../types';
import { logProjectsLoadMetrics } from '../../utils/projectsLoadMetrics';

const PROJECTS_PAGE_SIZE = 10;

// Loaded list kept in memory so that returning to the list (e.g. from a project page) restores it
// instantly instead of re-walking all pages. Entries expire after the TTL, after which the list is
// fetched again.
const LIST_CACHE_TTL_MS = 5 * 60 * 1000;

type ListCacheEntry = { pages: Project[][]; totalCount: number; savedAt: number };

const listCache = new Map<boolean, ListCacheEntry>();

const readListCache = (includeArchived: boolean): ListCacheEntry | undefined => {
  const entry = listCache.get(includeArchived);
  if (!entry) return undefined;
  if (Date.now() - entry.savedAt > LIST_CACHE_TTL_MS) {
    listCache.delete(includeArchived);
    return undefined;
  }
  return entry;
};

const isListComplete = (entry: ListCacheEntry) =>
  entry.pages.length >= Math.ceil(entry.totalCount / PROJECTS_PAGE_SIZE);

export const resetProjectsListCache = () => listCache.clear();

type UseAllProjectsOptions = {
  includeArchived?: boolean;
  /**
   * Fetch every page right after page 1 (concurrently). Off by default: only page 1 is
   * requested on mount and further pages are loaded explicitly through `loadMore`.
   */
  loadAll?: boolean;
};

type InFlightRequest = { abort?: () => void };

/**
 * Paginated `/projects/` loader.
 * - Mount (or `includeArchived` change): requests only page 1; stale requests are aborted.
 * - `loadMore()`: requests the next page, ignored while another request is in flight.
 * Pages are kept ordered by page number, and previously loaded data stays visible while
 * the new filter's page 1 is loading.
 */
export const useAllProjects = ({ includeArchived = false, loadAll = false }: UseAllProjectsOptions = {}) => {
  const [triggerGetProjects] = useLazyGetProjectsQuery();

  // Initial state comes from the in-memory cache (if fresh) so there is no spinner/flicker on return.
  const [initialCache] = useState(() => readListCache(includeArchived));
  const [pages, setPages] = useState<Project[][]>(initialCache?.pages ?? []);
  const [totalCount, setTotalCount] = useState<number | undefined>(initialCache?.totalCount);
  const [isLoadingInitial, setIsLoadingInitial] = useState(!initialCache);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isError, setIsError] = useState(false);

  // Bumped on every filter change/unmount; results of older epochs are discarded.
  const epochRef = useRef(0);
  const busyRef = useRef(false);
  const loadedPagesRef = useRef(initialCache?.pages.length ?? 0);
  const totalPagesRef = useRef(initialCache ? Math.max(1, Math.ceil(initialCache.totalCount / PROJECTS_PAGE_SIZE)) : 0);
  const pagesRef = useRef<Project[][]>(initialCache?.pages ?? []);
  const inFlightRef = useRef<Set<InFlightRequest>>(new Set());

  const commitPages = useCallback((key: boolean, next: Project[][], count: number) => {
    pagesRef.current = next;
    listCache.set(key, { pages: next, totalCount: count, savedAt: Date.now() });
    setPages(next);
  }, []);

  const requestPage = useCallback(
    (page: number) => {
      const req = triggerGetProjects({ page, pageSize: PROJECTS_PAGE_SIZE, includeArchived }, true);
      inFlightRef.current.add(req);
      return req.unwrap().finally(() => {
        inFlightRef.current.delete(req);
      });
    },
    [triggerGetProjects, includeArchived]
  );

  useEffect(() => {
    epochRef.current += 1;
    const epoch = epochRef.current;
    const isStale = () => epochRef.current !== epoch;
    const startedAt = typeof performance !== 'undefined' ? performance.now() : 0;
    const inFlight = inFlightRef.current;
    const cleanup = () => {
      epochRef.current += 1;
      inFlight.forEach((req) => req.abort?.());
      inFlight.clear();
    };

    const cached = readListCache(includeArchived);

    const run = async () => {
      setIsError(false);
      if (loadedPagesRef.current === 0) setIsLoadingInitial(true);
      else setIsLoadingMore(true);

      try {
        const first = await requestPage(1);
        if (isStale()) return;

        const totalPages = Math.max(1, Math.ceil(first.count / PROJECTS_PAGE_SIZE));
        loadedPagesRef.current = 1;
        totalPagesRef.current = totalPages;
        setTotalCount(first.count);
        commitPages(includeArchived, [first.results], first.count);
        setIsLoadingInitial(false);
        logProjectsLoadMetrics(startedAt);

        if (loadAll && totalPages > 1) {
          setIsLoadingMore(true);
          const rest = await Promise.all(Array.from({ length: totalPages - 1 }, (_, i) => requestPage(i + 2)));
          if (isStale()) return;
          loadedPagesRef.current = totalPages;
          commitPages(includeArchived, [first.results, ...rest.map((r) => r.results)], first.count);
        }
      } catch (error) {
        if (isStale()) return;
        console.error(error);
        setIsError(true);
      } finally {
        if (!isStale()) {
          busyRef.current = false;
          setIsLoadingInitial(false);
          setIsLoadingMore(false);
        }
      }
    };

    if (cached && (!loadAll || isListComplete(cached))) {
      // Restore the previously loaded list; no request. Remaining pages (if any) are loaded via loadMore.
      loadedPagesRef.current = cached.pages.length;
      totalPagesRef.current = Math.max(1, Math.ceil(cached.totalCount / PROJECTS_PAGE_SIZE));
      pagesRef.current = cached.pages;
      busyRef.current = false;
      setIsError(false);
      setTotalCount(cached.totalCount);
      setPages(cached.pages);
      setIsLoadingInitial(false);
      setIsLoadingMore(false);
    } else {
      busyRef.current = true;
      void run();
    }

    return cleanup;
  }, [requestPage, loadAll, includeArchived, commitPages]);

  const loadMore = useCallback(async () => {
    const page = loadedPagesRef.current + 1;
    if (busyRef.current || loadedPagesRef.current === 0 || page > totalPagesRef.current) return;

    const epoch = epochRef.current;
    busyRef.current = true;
    setIsLoadingMore(true);

    try {
      const res = await requestPage(page);
      if (epochRef.current !== epoch) return;
      loadedPagesRef.current = page;
      commitPages(includeArchived, [...pagesRef.current, res.results], res.count);
    } catch (error) {
      if (epochRef.current !== epoch) return;
      console.error(error);
      setIsError(true);
    } finally {
      if (epochRef.current === epoch) {
        busyRef.current = false;
        setIsLoadingMore(false);
      }
    }
  }, [requestPage, commitPages, includeArchived]);

  const projects = useMemo(() => (pages.length > 0 ? ([] as Project[]).concat(...pages) : undefined), [pages]);

  const hasMore = totalCount !== undefined && pages.length < Math.ceil(totalCount / PROJECTS_PAGE_SIZE);

  return {
    projects,
    totalCount,
    isLoadingInitial,
    isLoadingMore,
    isComplete: totalCount !== undefined && !hasMore && !isLoadingMore && !isLoadingInitial,
    hasMore,
    loadMore,
    isError,
  };
};
