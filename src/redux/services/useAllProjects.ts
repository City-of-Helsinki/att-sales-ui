import { useEffect, useRef, useState } from 'react';

import { useGetProjectsQuery } from './api';
import { Project } from '../../types';

/**
 * Fetches every page of `/projects/` sequentially and accumulates the
 * results so consumers see rows progressively stream in. We track the
 * last page that was merged into local state via a ref so the
 * accumulation effect only fires when a fresh page's results arrive,
 * regardless of how many times the parent component re-renders with
 * the same cached query result.
 */
export const useAllProjects = () => {
  const [page, setPage] = useState(1);
  const [projects, setProjects] = useState<Project[] | undefined>(undefined);
  const lastMergedPage = useRef<number>(0);

  const { currentData, data, isLoading, isFetching, isError } = useGetProjectsQuery({
    page,
    pageSize: 10,
  });

  useEffect(() => {
    if (!currentData) return;
    if (lastMergedPage.current === page) return;
    lastMergedPage.current = page;
    setProjects((prev) => {
      if (page === 1 || !prev) return currentData.results;
      return [...prev, ...currentData.results];
    });
  }, [currentData, page]);

  useEffect(() => {
    if (!currentData?.next) return;
    if (page !== lastMergedPage.current) return;
    setPage((p) => (p === page ? p + 1 : p));
  }, [currentData?.next, page]);

  return {
    projects,
    totalCount: data?.count,
    isLoadingInitial: isLoading,
    isLoadingMore: !!data?.next && isFetching,
    isComplete: !!data && !data.next,
    isError,
  };
};
