import { screen } from '@testing-library/react';
import CustomerReservations, { ReservationsByProject } from './CustomerReservations';
import { renderWithProviders } from '../../test/test-utils';
import { groupReservationsByProject } from '../../utils/mapReservationData';

import dummyCustomer from '../../mocks/customer.json';

describe('CustomerReservations', () => {
  it('renders the component', () => {
    renderWithProviders(<CustomerReservations customer={dummyCustomer} />);

    expect(screen.getAllByText('Asunto Oy Tuleva S', { exact: false })).toBeDefined();

    expect(screen.getAllByText('Haso Vanha Mylly', { exact: false })).toBeDefined();
  });
});

describe('ReservationsByProject', () => {
  const reservations = groupReservationsByProject(dummyCustomer.apartment_reservations);

  it('renders apartments', () => {
    window.sessionStorage.setItem('reservationProjectRowOpen-bdb19b55-5cb8-4f36-816a-000000000000', 'true');

    renderWithProviders(<ReservationsByProject customer={dummyCustomer} reservations={reservations[0]} />);

    expect(screen.getAllByText('B16', { exact: false })).toBeDefined();
    expect(screen.getAllByText('A10', { exact: false })).toBeDefined();
  });
});
