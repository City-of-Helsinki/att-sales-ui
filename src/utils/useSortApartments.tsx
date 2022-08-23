import React from 'react';

import useSessionStorage from './useSessionStorage';
import { sortAlphanumeric, sortNumeric } from './sortList';
import { Apartment } from '../types';

const useSortApartments = (items: any, sessionStorageID: string) => {
  const [sortConfig, setSortConfig] = useSessionStorage({
    defaultValue: {
      key: 'apartment_number',
      direction: 'ascending',
      alphaNumeric: true,
    },
    key: `sortConfig-${sessionStorageID}`,
  });

  const sortedApartments = React.useMemo((): Apartment[] => {
    if (items === undefined) return [];

    const sortableApartments = [...items];

    if (sortConfig === null) return sortableApartments;

    sortConfig.alphaNumeric
      ? sortAlphanumeric(sortableApartments, sortConfig.key, sortConfig.direction)
      : sortNumeric(sortableApartments, sortConfig.key, sortConfig.direction);

    return sortableApartments;
  }, [items, sortConfig]);

  const requestSort = (key: string, alphaNumeric: boolean) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction, alphaNumeric });
  };

  return { sortedApartments, requestSort, sortConfig };
};

export default useSortApartments;
