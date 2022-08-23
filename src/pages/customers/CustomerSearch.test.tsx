import { rest } from 'msw';
import { screen } from '@testing-library/react';

import CustomerSearch from './CustomerSearch';
import { server } from '../../test/server';
import { renderWithProviders } from '../../test/test-utils';

describe('CustomerSearch Page', () => {
  it('handles good response', async () => {
    renderWithProviders(<CustomerSearch />);

    await screen.findByText('pages.customers.CustomerSearch.pageTitle');
    await screen.findByText('pages.customers.CustomerSearch.btnCreateCustomer');
    await screen.findByText('components.customers.CustomerTable.noSearchQuery');
  });

  it('handles error response', async () => {
    // Mock search params so that we don't have an empty search query
    const location = {
      ...window.location,
      search: '?test=test',
    };
    Object.defineProperty(window, 'location', {
      writable: true,
      value: location,
    });

    // force msw to return error response
    server.use(
      rest.get(`${process.env.REACT_APP_API_BASE_URL}/customers`, (_req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    renderWithProviders(<CustomerSearch />);

    await screen.findByText('pages.customers.CustomerSearch.errorLoadingCustomers');
  });
});
