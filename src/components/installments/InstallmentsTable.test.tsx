import { screen } from '@testing-library/react';

import dummyCustomer from '../../mocks/customer.json';
import dummyInstallments from '../../mocks/apartment_installments.json';
import InstallmentsTable from './InstallmentsTable';
import { ApartmentInstallment, CustomerReservation } from '../../types';
import { renderWithProviders } from '../../test/test-utils';
import { getReservationApartmentData, getReservationProjectData } from '../../utils/mapReservationData';

const installments = dummyInstallments as ApartmentInstallment[];
const emptyInstallments = [] as any; // One without installments
const reservation = dummyCustomer.apartment_reservations[0] as CustomerReservation;
const apartment = getReservationApartmentData(reservation);
const project = getReservationProjectData(reservation);

describe('InstallmentsTable', () => {
  it('renders print button', () => {
    renderWithProviders(
      <InstallmentsTable
        apartment={apartment}
        installments={emptyInstallments}
        project={project}
        reservationId={0}
        targetPrice={0}
      />
    );
    expect(screen.getByText('components.installments.InstallmentsTable.printBankTransfers')).toBeDefined();
  });

  it('renders table header', () => {
    renderWithProviders(
      <InstallmentsTable
        apartment={apartment}
        installments={installments}
        project={project}
        reservationId={0}
        targetPrice={0}
      />
    );
    expect(screen.getByText('components.installments.InstallmentsTable.installmentType')).toBeDefined();
    expect(screen.getByText('components.installments.InstallmentsTable.sum')).toBeDefined();
    expect(screen.getByText('components.installments.InstallmentsTable.dueDate')).toBeDefined();
    expect(screen.getByText('components.installments.InstallmentsTable.IbanAccountNumber')).toBeDefined();
    expect(screen.getByText('components.installments.InstallmentsTable.referenceNumber')).toBeDefined();
    expect(screen.getByText('components.installments.InstallmentsTable.sentToSAP')).toBeDefined();
  });

  it('renders table footer', () => {
    renderWithProviders(
      <InstallmentsTable
        apartment={apartment}
        installments={installments}
        project={project}
        reservationId={0}
        targetPrice={0}
      />
    );
    expect(screen.getByText('components.installments.InstallmentsTable.total')).toBeDefined();
  });
});
