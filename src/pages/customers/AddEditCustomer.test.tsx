import { rest } from 'msw';
import { screen } from '@testing-library/react';

import AddEditCustomer from './AddEditCustomer';
import { renderWithProviders } from '../../test/test-utils';
import { server } from '../../test/server';

import mockCustomer from '../../mocks/customer.json';

describe('AddEditCustomer', () => {
  it('renders add customer form', () => {
    renderWithProviders(<AddEditCustomer isEditMode={false} />);
    screen.getAllByText('pages.customers.AddEditCustomer.createUser');
  });

  it('renders update customer form', () => {
    renderWithProviders(<AddEditCustomer isEditMode={true} />);
    screen.getAllByText('pages.customers.AddEditCustomer.editUser');
  });

  it('renders update customer form with co-applicant fields', async () => {
    server.use(
      rest.get(`${process.env.REACT_APP_API_BASE_URL}/customers/0`, (_req, res, ctx) => {
        return res(ctx.json(mockCustomer));
      })
    );
    renderWithProviders(<AddEditCustomer isEditMode={true} />);
    await screen.findByText('pages.customers.AddEditCustomer.secondaryCustomerPersonalInfo');
  });

  it('renders update customer form without co-applicant fields', async () => {
    const customerNoSecondaryProfile = { ...mockCustomer, secondary_profile: null };
    server.use(
      rest.get(`${process.env.REACT_APP_API_BASE_URL}/customers/0`, (_req, res, ctx) => {
        return res(ctx.json(customerNoSecondaryProfile));
      })
    );
    renderWithProviders(<AddEditCustomer isEditMode={true} />);
    expect(screen.queryByText('pages.customers.AddEditCustomer.secondaryCustomerPersonalInfo')).toBeNull();
  });

  it('handles error response', async () => {
    // force msw to return error response
    server.use(
      rest.get(`${process.env.REACT_APP_API_BASE_URL}/customers/0`, (_req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    renderWithProviders(<AddEditCustomer isEditMode={true} />);

    await screen.findByText('pages.customers.AddEditCustomer.errorLoadingCustomer');
  });
});
