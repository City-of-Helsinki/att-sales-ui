import { screen } from '@testing-library/react';

import InstallmentsTable from './InstallmentsTable';
import dummyInstallments from '../../mocks/apartment_installments.json';
import { ApartmentInstallment } from '../../types';
import { renderWithProviders } from '../../test/test-utils';

const installments = dummyInstallments as ApartmentInstallment[];
const emptyInstallments = [] as any; // One without installments

describe('InstallmentsTable', () => {
  it('renders InstallmentsTable component', () => {
    const { container } = renderWithProviders(<InstallmentsTable installments={emptyInstallments} />);
    const element = container.firstChild;
    expect(element).toBeDefined();
  });

  it('renders print button', () => {
    renderWithProviders(<InstallmentsTable installments={emptyInstallments} />);
    expect(screen.getByText('components.installments.InstallmentsTable.printBankTransfers')).toBeDefined();
  });

  it('renders table header', () => {
    renderWithProviders(<InstallmentsTable installments={installments} />);
    expect(screen.getByText('components.installments.InstallmentsTable.installmentType')).toBeDefined();
    expect(screen.getByText('components.installments.InstallmentsTable.sum')).toBeDefined();
    expect(screen.getByText('components.installments.InstallmentsTable.dueDate')).toBeDefined();
    expect(screen.getByText('components.installments.InstallmentsTable.IbanAccountNumber')).toBeDefined();
    expect(screen.getByText('components.installments.InstallmentsTable.referenceNumber')).toBeDefined();
    expect(screen.getByText('components.installments.InstallmentsTable.sentToSAP')).toBeDefined();
  });

  it('renders table footer', () => {
    renderWithProviders(<InstallmentsTable installments={installments} />);
    expect(screen.getByText('components.installments.InstallmentsTable.total')).toBeDefined();
  });
});
