import { screen } from '@testing-library/react';

import ApartmentTable from './ApartmentTable';
import mockProject from '../../mocks/project.json';
import { Apartment, Project } from '../../types';
import { renderWithProviders } from '../../test/test-utils';

const apartments: Apartment[] = mockProject.apartments;
const project: Project = mockProject;

describe('ApartmentTable', () => {
  it('renders ApartmentTable component', () => {
    const { container } = renderWithProviders(<ApartmentTable project={project} />);
    const element = container.firstChild;
    expect(element).toBeDefined();
  });

  it('renders table header elements', () => {
    renderWithProviders(
      <ApartmentTable apartments={apartments} isLoading={false} isError={false} isSuccess={true} project={project} />
    );

    expect(screen.getAllByText('components.apartment.ApartmentTable.apartment')).toBeDefined();
  });
});
