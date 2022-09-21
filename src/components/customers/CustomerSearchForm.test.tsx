import { screen, render } from '@testing-library/react';
import CustomerSearchForm from './CustomerSearchForm';

describe('CustomerSearchForm', () => {
  it('renders form labels', () => {
    const searchParams = new URLSearchParams({});
    render(<CustomerSearchForm searchParams={searchParams} handleFormCallback={() => null} />);

    expect(screen.getByText('components.customers.CustomerSearchForm.firstName')).toBeDefined();
    expect(screen.getByText('components.customers.CustomerSearchForm.lastName')).toBeDefined();
    expect(screen.getByText('components.customers.CustomerSearchForm.phone')).toBeDefined();
    expect(screen.getByText('components.customers.CustomerSearchForm.email')).toBeDefined();
  });

  it('renders submit button', () => {
    const searchParams = new URLSearchParams({});
    render(<CustomerSearchForm searchParams={searchParams} handleFormCallback={() => null} />);

    expect(screen.getByText('components.customers.CustomerSearchForm.btnSearch')).toBeDefined();
  });

  it('renders default input values based on current search query', () => {
    const searchParams = new URLSearchParams({
      first_name: 'matti',
      last_name: 'testaaja',
      email: 'matti.testaaja@example.com',
      phone_number: '05012345',
    });
    render(<CustomerSearchForm searchParams={searchParams} handleFormCallback={() => null} />);

    expect(screen.getByDisplayValue('matti')).toBeInTheDocument();
    expect(screen.getByDisplayValue('testaaja')).toBeInTheDocument();
    expect(screen.getByDisplayValue('matti.testaaja@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('05012345')).toBeInTheDocument();
  });
});
