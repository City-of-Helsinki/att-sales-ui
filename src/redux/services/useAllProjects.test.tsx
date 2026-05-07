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
    const trigger = jest.fn((args: { page: number; pageSize: number }) => {
      const page = args.page;
      const count = 3;

      const resultsByPage: Record<number, { uuid: string }[]> = {
        1: [{ uuid: 'p1' }],
        2: [{ uuid: 'p2' }],
        3: [{ uuid: 'p3' }],
      };

      // Resolve page 3 faster than page 2 to verify ordering logic.
      const delayMs = page === 2 ? 20 : page === 3 ? 5 : 0;

      return {
        unwrap: () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({ count, results: resultsByPage[page], next: null, previous: null });
            }, delayMs);
          }),
      };
    });

    mockedUseLazyGetProjectsQuery.mockReturnValue([trigger]);

    const { result, waitFor } = renderHook(() => useAllProjects());

    await waitFor(() => {
      expect(result.current.isComplete).toBe(true);
    });

    expect(trigger).toHaveBeenCalledWith({ page: 1, pageSize: 10 }, true);
    expect(trigger).toHaveBeenCalledWith({ page: 2, pageSize: 10 }, true);
    expect(trigger).toHaveBeenCalledWith({ page: 3, pageSize: 10 }, true);

    expect(result.current.projects).toEqual([{ uuid: 'p1' }, { uuid: 'p2' }, { uuid: 'p3' }]);
  });
});
