import { act, renderHook } from '@testing-library/react-hooks';

import useSortApartments from './useSortApartments';

const mockApartments = [
  { apartment_number: 'A1' },
  { apartment_number: 'B1' },
  { apartment_number: 'B2' },
  { apartment_number: 'A2' },
];

const mockApartmentsSortedAscending = [
  { apartment_number: 'A1' },
  { apartment_number: 'A2' },
  { apartment_number: 'B1' },
  { apartment_number: 'B2' },
];

const mockApartmentsSortedDescending = [
  { apartment_number: 'B2' },
  { apartment_number: 'B1' },
  { apartment_number: 'A2' },
  { apartment_number: 'A1' },
];

describe('SortApartments', () => {
  it('default sort by apartment_number as alphanumeric in ascending order', () => {
    const { result } = renderHook(() => useSortApartments(mockApartments, `testSort1`));
    const { sortedApartments } = result.current;
    expect(sortedApartments).toEqual(mockApartmentsSortedAscending);
  });

  it('sort by apartment_number as alphanumeric in descending order', () => {
    const { result } = renderHook(() => useSortApartments(mockApartments, `testSort2`));
    act(() => {
      // request current sort again to switch from ascending to descending
      result.current.requestSort('apartment_number', true);
    });
    const { sortedApartments } = result.current;
    expect(sortedApartments).toEqual(mockApartmentsSortedDescending);
  });
});
