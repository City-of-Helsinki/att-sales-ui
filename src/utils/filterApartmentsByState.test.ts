import { ApartmentState } from '../enums';
import { Apartment } from '../types';

import {
  ACTIVE_APARTMENTS_STATE_FILTER,
  ALL_APARTMENTS_STATE_FILTER,
  filterApartmentsByState,
} from './filterApartmentsByState';

const apartments = [
  { state: ApartmentState.FREE, apartment_number: 'A1' },
  { state: ApartmentState.RESERVED, apartment_number: 'A2' },
  { state: ApartmentState.SOLD, apartment_number: 'A3' },
  { state: ApartmentState.REVIEW, apartment_number: 'A4' },
] as Apartment[];

describe('filterApartmentsByState', () => {
  it('returns all apartments for all apartments filter', () => {
    const filtered = filterApartmentsByState(apartments, ALL_APARTMENTS_STATE_FILTER);
    expect(filtered).toHaveLength(4);
  });

  it('returns only apartments with selected state', () => {
    const filtered = filterApartmentsByState(apartments, ApartmentState.RESERVED);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].apartment_number).toBe('A2');
  });

  it('excludes free and sold apartments for active filter', () => {
    const filtered = filterApartmentsByState(apartments, ACTIVE_APARTMENTS_STATE_FILTER);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((apartment) => apartment.apartment_number)).toEqual(['A2', 'A4']);
  });
});
