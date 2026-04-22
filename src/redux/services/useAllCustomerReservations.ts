import { useEffect, useRef, useState } from 'react';

import { useGetCustomerReservationsQuery } from './api';
import { CustomerReservation } from '../../types';

/**
 * Fetches every page of `/customers/:id/apartment_reservations/` sequentially
 * and accumulates the results so consumers see rows progressively stream in.
 *
 * Mirrors the behavior of `useAllProjects`. We track the last page that was
 * merged into local state via a ref so the accumulation effect only fires
 * when a fresh page's results arrive, regardless of how many times the
 * parent component re-renders with the same cached query result.
 */
export const useAllCustomerReservations = (customerId: string | undefined) => {
  const [page, setPage] = useState(1);
  const [reservations, setReservations] = useState<CustomerReservation[] | undefined>(undefined);
  const lastMergedPage = useRef<number>(0);

  useEffect(() => {
    setPage(1);
    setReservations(undefined);
    lastMergedPage.current = 0;
  }, [customerId]);

  const { currentData, data, isLoading, isFetching, isError } = useGetCustomerReservationsQuery(
    { customerId: customerId || '0', page, pageSize: 5 },
    { skip: !customerId }
  );

  useEffect(() => {
    // Only merge when we have data for the *current* page argument.
    // RTK Query may temporarily keep the previous page's `data` while fetching
    // the new page, which would otherwise cause incorrect merges and a page
    // increment loop.
    if (!currentData) return;
    if (lastMergedPage.current === page) return;
    lastMergedPage.current = page;
    setReservations((prev) => {
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
    reservations,
    totalCount: data?.count,
    isLoadingInitial: isLoading,
    isLoadingMore: !!data?.next && isFetching,
    isComplete: !!data && !data.next,
    isError,
  };
};
