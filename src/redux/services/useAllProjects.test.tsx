import { act, renderHook } from '@testing-library/react-hooks';

import { useAllProjects, resetProjectsListCache } from './useAllProjects';
import { useLazyGetProjectsQuery } from './api';

jest.mock('./api', () => ({
  useLazyGetProjectsQuery: jest.fn(),
}));

const mockedUseLazyGetProjectsQuery = useLazyGetProjectsQuery as unknown as jest.Mock;

const makePage = (prefix: string, size: number) => Array.from({ length: size }, (_, i) => ({ uuid: `${prefix}-${i}` }));

describe('useAllProjects', () => {
  beforeEach(() => {
    mockedUseLazyGetProjectsQuery.mockReset();
    resetProjectsListCache();
  });

  it('restores the loaded list from memory on remount without new requests', async () => {
    const trigger = jest.fn((args: { page: number }) => ({
      unwrap: () => Promise.resolve({ count: 20, results: makePage(`p${args.page}`, 10), next: null, previous: null }),
    }));
    mockedUseLazyGetProjectsQuery.mockReturnValue([trigger]);

    const { result, waitFor, unmount } = renderHook(() => useAllProjects());
    await waitFor(() => expect(result.current.isLoadingInitial).toBe(false));
    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.isComplete).toBe(true);
    unmount();

    trigger.mockClear();
    const { result: remountedResult } = renderHook(() => useAllProjects());

    expect(remountedResult.current.isLoadingInitial).toBe(false);
    expect(remountedResult.current.projects).toHaveLength(20);
    expect(remountedResult.current.hasMore).toBe(false);
    expect(trigger).not.toHaveBeenCalled();
  });

  it('requests only page 1 on mount and loads next pages on demand', async () => {
    const totalItemCount = 22;
    const resultsByPage: Record<number, { uuid: string }[]> = {
      1: makePage('p1', 10),
      2: makePage('p2', 10),
      3: makePage('p3', 2),
    };

    const trigger = jest.fn((args: { page: number }) => ({
      unwrap: () =>
        Promise.resolve({ count: totalItemCount, results: resultsByPage[args.page], next: null, previous: null }),
    }));

    mockedUseLazyGetProjectsQuery.mockReturnValue([trigger]);

    const { result, waitFor } = renderHook(() => useAllProjects());

    await waitFor(() => {
      expect(result.current.isLoadingInitial).toBe(false);
    });

    expect(trigger).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveBeenCalledWith({ page: 1, pageSize: 10, includeArchived: false }, true);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.isComplete).toBe(false);

    await act(async () => {
      await result.current.loadMore();
    });
    await act(async () => {
      await result.current.loadMore();
    });

    expect(trigger).toHaveBeenCalledTimes(3);
    expect(trigger).toHaveBeenCalledWith({ page: 2, pageSize: 10, includeArchived: false }, true);
    expect(trigger).toHaveBeenCalledWith({ page: 3, pageSize: 10, includeArchived: false }, true);
    expect(result.current.isComplete).toBe(true);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.projects?.map((p) => p.uuid)).toEqual([
      ...resultsByPage[1].map((p) => p.uuid),
      ...resultsByPage[2].map((p) => p.uuid),
      ...resultsByPage[3].map((p) => p.uuid),
    ]);
  });

  it('ignores loadMore while a request is in flight', async () => {
    let resolvePage2: (v: unknown) => void = () => undefined;
    const trigger = jest.fn((args: { page: number }) => ({
      unwrap: () =>
        args.page === 1
          ? Promise.resolve({ count: 30, results: makePage('p1', 10), next: null, previous: null })
          : new Promise((resolve) => {
              resolvePage2 = resolve;
            }),
    }));

    mockedUseLazyGetProjectsQuery.mockReturnValue([trigger]);

    const { result, waitFor } = renderHook(() => useAllProjects());
    await waitFor(() => expect(result.current.isLoadingInitial).toBe(false));

    act(() => {
      result.current.loadMore();
      result.current.loadMore();
    });

    expect(trigger).toHaveBeenCalledTimes(2);

    await act(async () => {
      resolvePage2({ count: 30, results: makePage('p2', 10), next: null, previous: null });
    });
    await waitFor(() => expect(result.current.isLoadingMore).toBe(false));
    expect(result.current.projects).toHaveLength(20);
  });

  it('aborts the in-flight request when the filter changes', async () => {
    const abort = jest.fn();
    const trigger = jest.fn(() => ({
      abort,
      unwrap: () => new Promise(() => undefined),
    }));

    mockedUseLazyGetProjectsQuery.mockReturnValue([trigger]);

    const { rerender } = renderHook(({ includeArchived }) => useAllProjects({ includeArchived }), {
      initialProps: { includeArchived: false },
    });

    rerender({ includeArchived: true });

    expect(abort).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveBeenCalledTimes(2);
  });

  it('loads all pages when loadAll is enabled, keeping order', async () => {
    const resultsByPage: Record<number, { uuid: string }[]> = {
      1: makePage('p1', 10),
      2: makePage('p2', 10),
      3: makePage('p3', 2),
    };

    const trigger = jest.fn((args: { page: number }) => ({
      unwrap: () =>
        new Promise((resolve) => {
          // Resolve page 3 faster than page 2 to verify ordering.
          setTimeout(
            () => resolve({ count: 22, results: resultsByPage[args.page], next: null, previous: null }),
            args.page === 2 ? 20 : 0
          );
        }),
    }));

    mockedUseLazyGetProjectsQuery.mockReturnValue([trigger]);

    const { result, waitFor } = renderHook(() => useAllProjects({ loadAll: true }));

    await waitFor(() => expect(result.current.isComplete).toBe(true), { timeout: 3000 });

    expect(result.current.projects?.map((p) => p.uuid)).toEqual([
      ...resultsByPage[1].map((p) => p.uuid),
      ...resultsByPage[2].map((p) => p.uuid),
      ...resultsByPage[3].map((p) => p.uuid),
    ]);
  });

  it('requests archived projects when includeArchived option is enabled', async () => {
    const trigger = jest.fn(() => ({
      unwrap: () =>
        Promise.resolve({
          count: 1,
          results: [{ uuid: 'p1' }],
          next: null,
          previous: null,
        }),
    }));

    mockedUseLazyGetProjectsQuery.mockReturnValue([trigger]);

    const { result, waitFor } = renderHook(() => useAllProjects({ includeArchived: true }));

    await waitFor(() => {
      expect(result.current.isComplete).toBe(true);
    });

    expect(trigger).toHaveBeenCalledWith({ page: 1, pageSize: 10, includeArchived: true }, true);
  });
});
