import { screen } from '@testing-library/react';

import ApartmentRow from './ApartmentRow';
import mockProject from '../../mocks/project.json';
import { Apartment, Project } from '../../types';
import { renderWithProviders } from '../../test/test-utils';

const apartment = mockProject.apartments[0] as Apartment;
const partialProjectData = mockProject as unknown;
const project = partialProjectData as Project;

describe('ApartmentRow', () => {
  it('renders apartment details', () => {
    renderWithProviders(
      <ApartmentRow apartment={apartment} ownershipType="hitas" isLotteryCompleted project={project} />
    );

    expect(screen.getByText('A1')).not.toBeNull(); // apartment_number
    expect(screen.getByText('4h+kt+s')).not.toBeNull(); // apartment_structure
  });
});
