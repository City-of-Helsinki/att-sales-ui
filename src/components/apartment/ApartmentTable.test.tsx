import { screen } from '@testing-library/react';

import ApartmentTable from './ApartmentTable';
import mockProject from '../../mocks/project.json';
import { Apartment, Project } from '../../types';
import { renderWithProviders } from '../../test/test-utils';

const apartments = mockProject.apartments as Apartment[];
const partialProjectData = mockProject as unknown;
const project = partialProjectData as Project;

describe('ApartmentTable', () => {
  it('renders table header elements', () => {
    renderWithProviders(
      <ApartmentTable
        apartments={apartments}
        project={project}
        hasActiveFilters
        housingCompany="test"
        ownershipType="hitas"
        isLotteryCompleted
      />
    );

    expect(screen.getAllByText('components.apartment.ApartmentTable.apartment')).toBeDefined();
  });
});
