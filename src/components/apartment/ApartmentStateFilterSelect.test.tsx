import { render, screen } from '@testing-library/react';

import ApartmentStateFilterSelect from './ApartmentStateFilterSelect';

describe('ApartmentStateFilterSelect', () => {
  it('renders ApartmentStateFilterSelect', () => {
    const { container } = render(<ApartmentStateFilterSelect />);
    const element = container.firstChild;
    expect(element).toBeDefined();
  });

  it('renders ApartmentStateFilterSelect select component label', () => {
    render(<ApartmentStateFilterSelect />);
    expect(screen.getByText('components.apartment.ApartmentStateFilterSelect.show')).toBeDefined();
  });

  it('renders ApartmentStateFilterSelect active filter value', () => {
    render(<ApartmentStateFilterSelect activeFilter="free" />);
    expect(screen.getByText('ENUMS.ApartmentState.free')).toBeDefined();
  });
});
