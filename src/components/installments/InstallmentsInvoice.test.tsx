import { screen } from '@testing-library/react';

import InstallmentsInvoice from './InstallmentsInvoice';
import dummyReservation from '../../mocks/apartment_reservation.json';
import dummyProject from '../../mocks/project.json';
import { renderWithProviders } from '../../test/test-utils';

describe('InstallmentsInvoice', () => {
  beforeEach(() => {
    renderWithProviders(
      <InstallmentsInvoice
        reservationId={dummyReservation.id}
        installments={dummyReservation.installments}
        apartment={dummyProject.apartments[0]}
        project={dummyProject}
        handleCloseCallback={() => null}
      />
    );
  });

  it('renders project details', () => {
    expect(screen.getByText('Taloyhtiö 30+')).toBeDefined();
  });

  it('renders apartment details', () => {
    expect(screen.getByText('A1')).toBeDefined();
    expect(screen.getByText('4h+kt+s', { exact: false })).toBeDefined();
  });

  it('renders table header elements', () => {
    expect(screen.getByText('components.installments.InstallmentsInvoice.sum')).toBeDefined();
    expect(screen.getByText('components.installments.InstallmentsInvoice.dueDate')).toBeDefined();
  });

  it('renders table tbody', () => {
    expect(screen.getByDisplayValue('PAYMENT_1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('PAYMENT_2')).toBeInTheDocument();
    expect(screen.getAllByText('24.8.2019')).toBeDefined();
  });

  it('renders print and close buttons', () => {
    expect(screen.getByText('components.installments.InstallmentsInvoice.print')).toBeDefined();
    expect(screen.getByText('components.installments.InstallmentsInvoice.close')).toBeDefined();
  });
});
