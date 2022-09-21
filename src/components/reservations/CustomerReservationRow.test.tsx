import { screen } from '@testing-library/react';

import CustomerReservationRow from './CustomerReservationRow';
import dummyCustomer from '../../mocks/customer.json';
import { groupReservationsByProject } from '../../utils/mapReservationData';
import { renderWithProviders } from '../../test/test-utils';
import { Customer, CustomerReservation } from '../../types';

describe('CustomerReservationRow', () => {
  it('renders the component', () => {
    const customer = dummyCustomer as Customer;
    const apartmentReservations = customer.apartment_reservations as CustomerReservation[];
    const reservations = groupReservationsByProject(apartmentReservations);
    const reservation = reservations[0][0];

    renderWithProviders(<CustomerReservationRow customer={customer} reservation={reservation} />);

    expect(screen.getByText('B16')).toBeDefined();
    expect(screen.getByText('components.reservations.CustomerReservationRow.priority', { exact: false })).toBeDefined();
    expect(screen.getByText('components.reservations.CustomerReservationRow.createDeedOfSale')).toBeDefined();
  });
});
