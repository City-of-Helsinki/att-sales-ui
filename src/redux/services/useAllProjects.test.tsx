import { renderHook } from '@testing-library/react-hooks';

import { useAllProjects } from './useAllProjects';
import { useLazyGetProjectsQuery } from './api';

jest.mock('./api', () => ({
  useLazyGetProjectsQuery: jest.fn(),
}));

const mockedUseLazyGetProjectsQuery = useLazyGetProjectsQuery as unknown as jest.Mock;

describe('useAllProjects', () => {
  beforeEach(() => {
    mockedUseLazyGetProjectsQuery.mockReset();
  });

  it('loads pages concurrently but keeps order', async () => {
    // total item count drives page count (ceil(count / pageSize)); need 3 pages and
    // enough rows that projects.length >= count for isComplete.
    const totalItemCount = 22;
    const resultsByPage: Record<number, { uuid: string }[]> = {
      1: [{ uuid: 'p1' }, ...Array.from({ length: 9 }, (_, i) => ({ uuid: `p1x-${i}` }))],
      2: [{ uuid: 'p2' }, ...Array.from({ length: 9 }, (_, i) => ({ uuid: `p2x-${i}` }))],
      3: [{ uuid: 'p3' }, { uuid: 'p3x-0' }],
    };

    const trigger = jest.fn((args: { page: number; pageSize: number }) => {
      const page = args.page;

      // Resolve page 3 faster than page 2 to verify ordering logic.
      let delayMs = 0;
      if (page === 2) delayMs = 20;
      else if (page === 3) delayMs = 5;

      return {
        unwrap: () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                count: totalItemCount,
                results: resultsByPage[page],
                next: null,
                previous: null,
              });
            }, delayMs);
          }),
      };
    });

    mockedUseLazyGetProjectsQuery.mockReturnValue([trigger]);

    const { result, waitFor } = renderHook(() => useAllProjects());

    await waitFor(
      () => {
        expect(result.current.isComplete).toBe(true);
      },
      { timeout: 3000 }
    );

    expect(trigger).toHaveBeenCalledWith({ page: 1, pageSize: 10 }, true);
    expect(trigger).toHaveBeenCalledWith({ page: 2, pageSize: 10 }, true);
    expect(trigger).toHaveBeenCalledWith({ page: 3, pageSize: 10 }, true);

    expect(result.current.projects?.map((p) => p.uuid)).toEqual([
      ...resultsByPage[1].map((p) => p.uuid),
      ...resultsByPage[2].map((p) => p.uuid),
      ...resultsByPage[3].map((p) => p.uuid),
    ]);
  });
});
