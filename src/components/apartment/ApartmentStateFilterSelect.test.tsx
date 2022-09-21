import { render, screen } from '@testing-library/react';

import ApartmentStateFilterSelect from './ApartmentStateFilterSelect';

describe('ApartmentStateFilterSelect', () => {
  it('renders ApartmentStateFilterSelect select component label', () => {
    render(<ApartmentStateFilterSelect activeFilter="" handleFilterChangeCallback={() => null} />);
    expect(screen.getByText('components.apartment.ApartmentStateFilterSelect.show')).toBeDefined();
  });

  it('renders ApartmentStateFilterSelect active filter value', () => {
    render(<ApartmentStateFilterSelect activeFilter="free" handleFilterChangeCallback={() => null} />);
    expect(screen.getByText('ENUMS.ApartmentState.free')).toBeDefined();
  });
});
