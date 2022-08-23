import { screen } from '@testing-library/react';

import CustomerReservationRow from './CustomerReservationRow';
import { groupReservationsByProject } from '../../utils/mapReservationData';
import { renderWithProviders } from '../../test/test-utils';

import dummyCustomer from '../../mocks/customer.json';

describe('CustomerReservationRow', () => {
  it('renders the component', () => {
    const reservations = groupReservationsByProject(dummyCustomer.apartment_reservations);
    const reservation = reservations[0][0];

    renderWithProviders(<CustomerReservationRow customer={dummyCustomer} reservation={reservation} />);

    expect(screen.getByText('B16')).toBeDefined();
    expect(screen.getByText('components.reservations.CustomerReservationRow.priority', { exact: false })).toBeDefined();
    expect(screen.getByText('components.reservations.CustomerReservationRow.createDeedOfSale')).toBeDefined();
  });
});
