import { rest } from 'msw';
import { screen } from '@testing-library/react';

import ProjectDetail from './ProjectDetail';
import { server } from '../../test/server';
import { renderWithProviders } from '../../test/test-utils';

describe('ProjectDetail Page', () => {
  it('handles good response', async () => {
    renderWithProviders(<ProjectDetail />);

    await screen.findByText('Kolkyt 30');
  });

  it('handles response when project is undefined', async () => {
    // force msw to return empty project
    server.use(
      rest.get(`${process.env.REACT_APP_API_BASE_URL}/projects/0`, (_req, res, ctx) => {
        return res(ctx.json(undefined));
      })
    );

    renderWithProviders(<ProjectDetail />);

    expect(screen.queryByText('pages.project.ProjectDetail.projectApartments')).toBeNull();
  });

  it('handles error response', async () => {
    // force msw to return error response
    server.use(
      rest.get(`${process.env.REACT_APP_API_BASE_URL}/projects/0`, (_req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    renderWithProviders(<ProjectDetail />);

    await screen.findByText('pages.project.ProjectDetail.errorLoadingProject');
  });
});
