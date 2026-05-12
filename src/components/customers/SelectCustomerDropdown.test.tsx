import { screen } from '@testing-library/react';

import SelectCustomerDropdown, { filterCustomersForOwnershipType } from './SelectCustomerDropdown';
import { CustomerListItem } from '../../types';
import { renderWithProviders } from '../../test/test-utils';

describe('SelectCustomerDropdown', () => {
  it('renders SelectCustomerDropdown component', async () => {
    renderWithProviders(<SelectCustomerDropdown handleSelectCallback={() => null} />);
    await screen.findByText('components.customers.SelectCustomerDropdown.selectCustomer');
  });
});

describe('filterCustomersForOwnershipType', () => {
  const withRor: CustomerListItem = {
    id: 1,
    primary_first_name: 'Alice',
    primary_last_name: 'Anderson',
    primary_email: 'alice@example.com',
    primary_phone_number: '',
    right_of_residence: 1234,
  };
  const withoutRor: CustomerListItem = {
    id: 2,
    primary_first_name: 'Bob',
    primary_last_name: 'Brown',
    primary_email: 'bob@example.com',
    primary_phone_number: '',
    right_of_residence: null,
  };
  const undefinedRor: CustomerListItem = {
    id: 3,
    primary_first_name: 'Carol',
    primary_last_name: 'Clark',
    primary_email: 'carol@example.com',
    primary_phone_number: '',
  };

  it('drops customers without right_of_residence when ownershipType is "haso"', () => {
    const result = filterCustomersForOwnershipType([withRor, withoutRor, undefinedRor], 'haso');
    expect(result).toEqual([withRor]);
  });

  it('treats ownershipType case-insensitively', () => {
    expect(filterCustomersForOwnershipType([withRor, withoutRor], 'HASO')).toEqual([withRor]);
    expect(filterCustomersForOwnershipType([withRor, withoutRor], 'Haso')).toEqual([withRor]);
  });

  it('keeps customers with right_of_residence = 0 (valid HASO number)', () => {
    const zeroRor: CustomerListItem = { ...withRor, id: 4, right_of_residence: 0 };
    expect(filterCustomersForOwnershipType([zeroRor], 'haso')).toEqual([zeroRor]);
  });

  it('returns the full list for non-HASO ownership types', () => {
    expect(filterCustomersForOwnershipType([withRor, withoutRor, undefinedRor], 'hitas')).toEqual([
      withRor,
      withoutRor,
      undefinedRor,
    ]);
  });

  it('returns the full list when ownershipType is undefined', () => {
    expect(filterCustomersForOwnershipType([withRor, withoutRor, undefinedRor], undefined)).toEqual([
      withRor,
      withoutRor,
      undefinedRor,
    ]);
  });
});
