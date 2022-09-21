import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

import ApartmentBaseDetails from './ApartmentBaseDetails';
import mockProject from '../../mocks/project.json';
import { Apartment } from '../../types';

const mockApartment = mockProject.apartments[0] as Apartment;

describe('ApartmentBaseDetails', () => {
  it('renders apartment details', () => {
    render(
      <BrowserRouter>
        <ApartmentBaseDetails apartment={mockApartment} isLotteryResult showState />
      </BrowserRouter>
    );

    expect(screen.getByText('A1')).not.toBeNull(); // apartment_number
    expect(screen.getByText('4h+kt+s')).not.toBeNull(); // apartment_structure
  });
});
