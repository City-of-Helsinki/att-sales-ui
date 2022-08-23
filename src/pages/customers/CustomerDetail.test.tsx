import { rest } from 'msw';
import { screen } from '@testing-library/react';

import CustomerDetail from './CustomerDetail';
import { renderWithProviders } from '../../test/test-utils';
import { server } from '../../test/server';

describe('CustomerDetail Page', () => {
  it('handles good response', async () => {
    renderWithProviders(<CustomerDetail />);

    await screen.findAllByText('Meikäläinen, Matti', { exact: false });
  });

  it('handles response when customer is undefined', async () => {
    // force msw to return empty customer
    server.use(
      rest.get(`${process.env.REACT_APP_API_BASE_URL}/customers/0`, (_req, res, ctx) => {
        return res(ctx.json(undefined));
      })
    );

    renderWithProviders(<CustomerDetail />);

    expect(screen.queryByText('pages.customers.CustomerDetail.customerDetails')).toBeNull();
  });

  it('handles error response', async () => {
    // force msw to return error response
    server.use(
      rest.get(`${process.env.REACT_APP_API_BASE_URL}/customers/0`, (_req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    renderWithProviders(<CustomerDetail />);

    await screen.findByText('pages.customers.CustomerDetail.errorLoadingCustomer');
  });
});
