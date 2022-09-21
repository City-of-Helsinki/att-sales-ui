import { BrowserRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';

import CustomerTableRow from './CustomerTableRow';
import mockCustomers from '../../mocks/customers.json';
import { CustomerListItem } from '../../types';

const customer: CustomerListItem = mockCustomers[0];

describe('CustomerTableRow', () => {
  it('renders customer table cell data', () => {
    render(
      <BrowserRouter>
        <table>
          <tbody>
            <CustomerTableRow customer={customer} />
          </tbody>
        </table>
      </BrowserRouter>
    );

    expect(screen.getAllByText('Meikäläinen, Matti')).toBeDefined();
    expect(screen.getAllByText('matti.meikalainen@example.com')).toBeDefined();
    expect(screen.getAllByText('+358501234567')).toBeDefined();
    expect(screen.getAllByText('Meikäläinen, Maija')).toBeDefined();
  });
});
