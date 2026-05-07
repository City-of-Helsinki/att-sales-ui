import { useEffect, useMemo, useRef, useState } from 'react';

import { useLazyGetProjectsQuery } from './api';
import { Project } from '../../types';

/**
 * Fetches every page of `/projects/` concurrently after page 1, while keeping
 * the exposed `projects` array strictly ordered by page number.
 */
export const useAllProjects = () => {
  const PAGE_SIZE = 10;
  const [triggerGetProjects] = useLazyGetProjectsQuery();

  const resultsByPageRef = useRef<Map<number, Project[]>>(new Map());
  const [version, setVersion] = useState(0);
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isError, setIsError] = useState(false);

  const projects = useMemo(() => {
    void version;
    const pages = Array.from(resultsByPageRef.current.keys()).sort((a, b) => a - b);
    if (pages.length === 0) return undefined;
    return pages.reduce<Project[]>((acc, page) => {
      const pageResults = resultsByPageRef.current.get(page);
      if (!pageResults) return acc;
      acc.push(...pageResults);
      return acc;
    }, []);
  }, [version]);

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      resultsByPageRef.current = new Map();
      setVersion((v) => v + 1);
      setTotalCount(undefined);
      setIsError(false);
      setIsLoadingInitial(true);
      setPendingCount(0);

      try {
        const first = await triggerGetProjects({ page: 1, pageSize: PAGE_SIZE }, true).unwrap();
        if (cancelled) return;

        resultsByPageRef.current.set(1, first.results);
        setTotalCount(first.count);
        setVersion((v) => v + 1);

        const totalPages = Math.max(1, Math.ceil(first.count / PAGE_SIZE));
        const pagesToFetch = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);

        if (pagesToFetch.length === 0) return;

        setPendingCount(pagesToFetch.length);
        await Promise.all(
          pagesToFetch.map(async (page) => {
            try {
              const res = await triggerGetProjects({ page, pageSize: PAGE_SIZE }, true).unwrap();
              if (cancelled) return;
              resultsByPageRef.current.set(page, res.results);
              setVersion((v) => v + 1);
            } catch (e) {
              if (!cancelled) setIsError(true);
            } finally {
              if (!cancelled) setPendingCount((c) => Math.max(0, c - 1));
            }
          })
        );
      } catch (e) {
        if (!cancelled) setIsError(true);
      } finally {
        if (!cancelled) setIsLoadingInitial(false);
      }
    };

    void fetchAll();

    return () => {
      cancelled = true;
    };
  }, [triggerGetProjects]);

  return {
    projects,
    totalCount,
    isLoadingInitial,
    isLoadingMore: !isLoadingInitial && pendingCount > 0,
    isComplete: totalCount !== undefined && (projects?.length ?? 0) >= totalCount && pendingCount === 0,
    isError,
  };
};
