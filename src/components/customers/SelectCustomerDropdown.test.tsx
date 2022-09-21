import { screen } from '@testing-library/react';

import SelectCustomerDropdown from './SelectCustomerDropdown';
import { renderWithProviders } from '../../test/test-utils';

describe('SelectCustomerDropdown', () => {
  it('renders SelectCustomerDropdown component', async () => {
    renderWithProviders(<SelectCustomerDropdown handleSelectCallback={() => null} />);
    await screen.findByText('components.customers.SelectCustomerDropdown.selectCustomer');
  });
});
