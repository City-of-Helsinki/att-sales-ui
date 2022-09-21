import { screen } from '@testing-library/react';

import InstallmentsInvoice from './InstallmentsInvoice';
import dummyReservation from '../../mocks/apartment_reservation.json';
import dummyProject from '../../mocks/project.json';
import { renderWithProviders } from '../../test/test-utils';
import { Apartment, ApartmentInstallment, Project } from '../../types';

const apartment = dummyProject.apartments[0] as Apartment;
const installments = dummyReservation.installments as ApartmentInstallment[];
const partialProjectData = dummyProject as unknown;
const project = partialProjectData as Project;

describe('InstallmentsInvoice', () => {
  const renderView = () =>
    renderWithProviders(
      <InstallmentsInvoice
        apartment={apartment}
        handleCloseCallback={() => null}
        installments={installments}
        project={project}
        reservationId={dummyReservation.id}
      />
    );

  it('renders project details', () => {
    renderView();
    expect(screen.getByText('Taloyhtiö 30+')).toBeDefined();
  });

  it('renders apartment details', () => {
    renderView();
    expect(screen.getByText('A1')).toBeDefined();
    expect(screen.getByText('4h+kt+s', { exact: false })).toBeDefined();
  });

  it('renders table header elements', () => {
    renderView();
    expect(screen.getByText('components.installments.InstallmentsInvoice.sum')).toBeDefined();
    expect(screen.getByText('components.installments.InstallmentsInvoice.dueDate')).toBeDefined();
  });

  it('renders table tbody', () => {
    renderView();
    expect(screen.getByDisplayValue('PAYMENT_1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('PAYMENT_2')).toBeInTheDocument();
    expect(screen.getAllByText('24.8.2019')).toBeDefined();
  });

  it('renders print and close buttons', () => {
    renderView();
    expect(screen.getByText('components.installments.InstallmentsInvoice.print')).toBeDefined();
    expect(screen.getByText('components.installments.InstallmentsInvoice.close')).toBeDefined();
  });
});
