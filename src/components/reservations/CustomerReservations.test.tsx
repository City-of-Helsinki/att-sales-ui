import { screen } from '@testing-library/react';

import CustomerReservations, { ReservationsByProject } from './CustomerReservations';
import dummyCustomer from '../../mocks/customer.json';
import { renderWithProviders } from '../../test/test-utils';
import { groupReservationsByProject } from '../../utils/mapReservationData';
import { Customer, CustomerReservation } from '../../types';

const customer = dummyCustomer as unknown as Customer;
const customerReservations = (dummyCustomer as any).apartment_reservations as CustomerReservation[];

describe('CustomerReservations', () => {
  it('renders the component', () => {
    renderWithProviders(<CustomerReservations customer={customer} reservations={customerReservations} />);

    expect(screen.getAllByText('Asunto Oy Tuleva S', { exact: false })).toBeDefined();

    expect(screen.getAllByText('Haso Vanha Mylly', { exact: false })).toBeDefined();
  });

  it('shows the empty state when there are no reservations and loading is done', () => {
    renderWithProviders(<CustomerReservations customer={customer} reservations={[]} />);

    expect(screen.getByText('components.reservations.CustomerReservations.noReservations')).toBeDefined();
  });
});

describe('ReservationsByProject', () => {
  const reservations = groupReservationsByProject(customerReservations);

  it('renders apartments', () => {
    window.sessionStorage.setItem('reservationProjectRowOpen-bdb19b55-5cb8-4f36-816a-000000000000', 'true');

    renderWithProviders(<ReservationsByProject customer={customer} reservations={reservations[0]} />);

    expect(screen.getAllByText('B16', { exact: false })).toBeDefined();
    expect(screen.getAllByText('A10', { exact: false })).toBeDefined();
  });
});
