import { renderHook } from '@testing-library/react-hooks';

import { useAllProjects } from './useAllProjects';
import { useGetProjectsQuery } from './api';

jest.mock('./api', () => ({
  useGetProjectsQuery: jest.fn(),
}));

const mockedUseGetProjectsQuery = useGetProjectsQuery as unknown as jest.Mock;

describe('useAllProjects', () => {
  beforeEach(() => {
    mockedUseGetProjectsQuery.mockReset();
  });

  it('auto-advances page while next is present', async () => {
    mockedUseGetProjectsQuery.mockImplementation(({ page }: { page: number }) => {
      if (page === 1) {
        return {
          currentData: { count: 3, next: '/api/projects/?page=2', previous: null, results: [{ uuid: 'p1' }] },
          data: { count: 3, next: '/api/projects/?page=2', previous: null, results: [{ uuid: 'p1' }] },
          isLoading: false,
          isFetching: false,
          isError: false,
        };
      }
      return {
        currentData: { count: 2, next: null, previous: '/api/projects/?page=1', results: [{ uuid: 'p2' }] },
        data: { count: 2, next: null, previous: '/api/projects/?page=1', results: [{ uuid: 'p2' }] },
        isLoading: false,
        isFetching: false,
        isError: false,
      };
    });

    const { result, waitFor } = renderHook(() => useAllProjects());

    expect(mockedUseGetProjectsQuery).toHaveBeenCalledWith({ page: 1, pageSize: 10 });
    await waitFor(() => {
      expect(mockedUseGetProjectsQuery).toHaveBeenCalledWith({ page: 2, pageSize: 10 });
    });

    expect(mockedUseGetProjectsQuery).toHaveBeenCalledWith({ page: 2, pageSize: 10 });
    expect(result.current.projects).toEqual([{ uuid: 'p1' }, { uuid: 'p2' }]);
    expect(result.current.isComplete).toBe(true);
  });
});
