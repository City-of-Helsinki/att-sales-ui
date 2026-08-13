import { fireEvent, screen, waitFor } from '@testing-library/react';

import SelectCustomerDropdown from './SelectCustomerDropdown';
import { renderWithProviders } from '../../test/test-utils';
import { useLazyGetCustomersQuery } from '../../redux/services/api';

jest.mock('../../redux/services/api', () => ({
  ...jest.requireActual('../../redux/services/api'),
  useLazyGetCustomersQuery: jest.fn(),
}));

const mockedUseLazyGetCustomersQuery = useLazyGetCustomersQuery as unknown as jest.Mock;

describe('SelectCustomerDropdown', () => {
  beforeEach(() => {
    mockedUseLazyGetCustomersQuery.mockReset();
    mockedUseLazyGetCustomersQuery.mockReturnValue([jest.fn(() => ({ unwrap: async () => [] }))]);
  });

  it('renders SelectCustomerDropdown component', async () => {
    renderWithProviders(<SelectCustomerDropdown handleSelectCallback={() => null} />);
    await screen.findByText('components.customers.SelectCustomerDropdown.selectCustomer');
  });

  it('searches by multiple backend fields with one input and deduplicates results', async () => {
    const firstCustomer: CustomerListItem = {
      id: 1,
      primary_first_name: 'Matti',
      primary_last_name: 'Virtanen',
      primary_email: 'matti@example.com',
      primary_phone_number: '',
    };
    const secondCustomer: CustomerListItem = {
      id: 2,
      primary_first_name: 'Maija',
      primary_last_name: 'Korhonen',
      primary_email: 'maija@example.com',
      primary_phone_number: '',
    };

    const trigger = jest.fn((params: string) => ({
      unwrap: async () => {
        if (params.startsWith('last_name=')) {
          return [firstCustomer];
        }
        if (params.startsWith('first_name=')) {
          return [firstCustomer, secondCustomer];
        }
        if (params.startsWith('hetu=')) {
          return [secondCustomer];
        }
        return [];
      },
    }));

    mockedUseLazyGetCustomersQuery.mockReturnValue([trigger]);

    renderWithProviders(<SelectCustomerDropdown handleSelectCallback={() => null} />);

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Matti' } });

    await waitFor(() => {
      expect(screen.getByText('Virtanen, Matti - matti@example.com - ID: 1')).toBeInTheDocument();
    });

    expect(trigger).toHaveBeenCalledWith('last_name=Matti');
    expect(trigger).toHaveBeenCalledWith('first_name=Matti');
    expect(trigger).not.toHaveBeenCalledWith('hetu=Matti');
    expect(trigger).not.toHaveBeenCalledWith('date_of_birth=Matti');
    expect(screen.getByText('Korhonen, Maija - maija@example.com - ID: 2')).toBeInTheDocument();
    expect(screen.getAllByText('Virtanen, Matti - matti@example.com - ID: 1')).toHaveLength(1);
  });

  it('searches hetu input only with hetu parameter', async () => {
    const customer: CustomerListItem = {
      id: 7,
      primary_first_name: 'Hetu',
      primary_last_name: 'Customer',
      primary_email: 'hetu@example.com',
      primary_phone_number: '',
    };

    const trigger = jest.fn((params: string) => ({
      unwrap: async () => {
        if (params === 'hetu=030978-2479') {
          return [customer];
        }

        return [];
      },
    }));

    mockedUseLazyGetCustomersQuery.mockReturnValue([trigger]);

    renderWithProviders(<SelectCustomerDropdown handleSelectCallback={() => null} />);

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '030978-2479' } });

    await waitFor(() => {
      expect(trigger).toHaveBeenCalledWith('hetu=030978-2479');
    });

    expect(trigger).not.toHaveBeenCalledWith('date_of_birth=030978-2479');
    expect(trigger).not.toHaveBeenCalledWith('last_name=030978-2479');
    expect(trigger).not.toHaveBeenCalledWith('first_name=030978-2479');
  });
});
