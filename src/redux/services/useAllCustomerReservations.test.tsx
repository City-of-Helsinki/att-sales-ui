import { renderHook } from '@testing-library/react-hooks';

import { useAllCustomerReservations } from './useAllCustomerReservations';
import { useGetCustomerReservationsQuery } from './api';

jest.mock('./api', () => ({
  useGetCustomerReservationsQuery: jest.fn(),
}));

const mockedUseGetCustomerReservationsQuery = useGetCustomerReservationsQuery as unknown as jest.Mock;

describe('useAllCustomerReservations', () => {
  beforeEach(() => {
    mockedUseGetCustomerReservationsQuery.mockReset();
  });

  it('skips the query when customerId is not provided', () => {
    mockedUseGetCustomerReservationsQuery.mockReturnValue({
      currentData: undefined,
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: false,
    });

    renderHook(() => useAllCustomerReservations(undefined));

    expect(mockedUseGetCustomerReservationsQuery).toHaveBeenCalledWith(expect.any(Object), { skip: true });
  });

  it('auto-advances page and accumulates reservations while next is present', async () => {
    mockedUseGetCustomerReservationsQuery.mockImplementation(({ page }: { page: number }) => {
      if (page === 1) {
        return {
          currentData: {
            count: 3,
            next: '/api/customers/42/apartment_reservations/?page=2',
            previous: null,
            results: [{ id: 1 }],
          },
          data: {
            count: 3,
            next: '/api/customers/42/apartment_reservations/?page=2',
            previous: null,
            results: [{ id: 1 }],
          },
          isLoading: false,
          isFetching: false,
          isError: false,
        };
      }
      return {
        currentData: {
          count: 3,
          next: null,
          previous: '/api/customers/42/apartment_reservations/?page=1',
          results: [{ id: 2 }, { id: 3 }],
        },
        data: {
          count: 3,
          next: null,
          previous: '/api/customers/42/apartment_reservations/?page=1',
          results: [{ id: 2 }, { id: 3 }],
        },
        isLoading: false,
        isFetching: false,
        isError: false,
      };
    });

    const { result, waitFor } = renderHook(() => useAllCustomerReservations('42'));

    expect(mockedUseGetCustomerReservationsQuery).toHaveBeenCalledWith(
      { customerId: '42', page: 1, pageSize: 5 },
      { skip: false }
    );

    await waitFor(() => {
      expect(mockedUseGetCustomerReservationsQuery).toHaveBeenCalledWith(
        { customerId: '42', page: 2, pageSize: 5 },
        { skip: false }
      );
    });

    expect(result.current.reservations).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(result.current.totalCount).toBe(3);
    expect(result.current.isComplete).toBe(true);
    expect(result.current.isLoadingMore).toBe(false);
  });

  it('resets accumulated reservations when customerId changes', async () => {
    mockedUseGetCustomerReservationsQuery.mockImplementation(
      ({ customerId, page }: { customerId: string; page: number }) => {
        return {
          currentData: {
            count: 1,
            next: null,
            previous: null,
            results: [{ id: page === 1 ? `${customerId}-only` : 'other' }],
          },
          data: {
            count: 1,
            next: null,
            previous: null,
            results: [{ id: page === 1 ? `${customerId}-only` : 'other' }],
          },
          isLoading: false,
          isFetching: false,
          isError: false,
        };
      }
    );

    const { result, rerender, waitFor } = renderHook(
      ({ customerId }: { customerId: string }) => useAllCustomerReservations(customerId),
      { initialProps: { customerId: '42' } }
    );

    await waitFor(() => {
      expect(result.current.reservations).toEqual([{ id: '42-only' }]);
    });

    rerender({ customerId: '99' });

    await waitFor(() => {
      expect(result.current.reservations).toEqual([{ id: '99-only' }]);
    });
  });
});
