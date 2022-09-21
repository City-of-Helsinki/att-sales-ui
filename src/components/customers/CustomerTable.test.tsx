import { BrowserRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';

import CustomerTable from './CustomerTable';
import mockCustomers from '../../mocks/customers.json';
import { CustomerListItem } from '../../types';

const customers: CustomerListItem[] = mockCustomers;

describe('CustomerTable', () => {
  it('renders table header elements', () => {
    render(
      <BrowserRouter>
        <CustomerTable customers={customers} isLoading={false} hasSearchQuery />
      </BrowserRouter>
    );

    expect(screen.getAllByText('components.customers.CustomerTable.customer')).toBeDefined();
    expect(screen.getAllByText('components.customers.CustomerTable.email')).toBeDefined();
    expect(screen.getAllByText('components.customers.CustomerTable.phone')).toBeDefined();
    expect(screen.getAllByText('components.customers.CustomerTable.coApplicant')).toBeDefined();
  });

  it('renders loading message', () => {
    render(
      <BrowserRouter>
        <CustomerTable customers={customers} isLoading hasSearchQuery />
      </BrowserRouter>
    );

    expect(screen.getAllByText('components.customers.CustomerTable.loading')).toBeDefined();
  });

  it('renders no results message', () => {
    render(
      <BrowserRouter>
        <CustomerTable customers={[]} isLoading={false} hasSearchQuery />
      </BrowserRouter>
    );

    expect(screen.getAllByText('components.customers.CustomerTable.noResults')).toBeDefined();
  });

  it('renders no search query message', () => {
    render(
      <BrowserRouter>
        <CustomerTable customers={customers} isLoading={false} hasSearchQuery={false} />
      </BrowserRouter>
    );

    expect(screen.getAllByText('components.customers.CustomerTable.noSearchQuery')).toBeDefined();
  });
});
