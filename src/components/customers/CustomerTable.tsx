import React from 'react';
import cx from 'classnames';
import { useTranslation } from 'react-i18next';
import { IconSortAscending, IconSortDescending, LoadingSpinner } from 'hds-react';

import CustomerTableRow from './CustomerTableRow';
import StatusText from '../../components/common/statusText/StatusText';
import useSessionStorage from '../../utils/useSessionStorage';
import { CustomerListItem } from '../../types';
import { sortAlphanumeric } from '../../utils/sortList';

import styles from './CustomerTable.module.scss';

const T_PATH = 'components.customers.CustomerTable';

interface IProps {
  customers?: CustomerListItem[];
  hasSearchQuery: boolean;
  isLoading: boolean;
}

const CustomerTable = ({ customers, hasSearchQuery, isLoading }: IProps): JSX.Element | null => {
  const { t } = useTranslation();
  const [sortDirection, setSortDirection] = useSessionStorage({
    defaultValue: 'ascending',
    key: 'customerTableSort',
  });
  const customersCopy = customers ? [...customers] : [];
  const sortedByFirstname = customersCopy.sort((a, b) => a.primary_first_name.localeCompare(b.primary_first_name));
  const sortedCustomers: CustomerListItem[] = sortAlphanumeric(
    sortedByFirstname ? sortedByFirstname : [],
    'primary_last_name',
    sortDirection
  );

  const requestSort = () => {
    if (sortDirection === 'ascending') {
      setSortDirection('descending');
    } else {
      setSortDirection('ascending');
    }
  };

  const apartmentSortClasses = () => {
    return cx(styles.sortButton, styles.activeSort, {
      [styles.ascending]: sortDirection === 'ascending',
      [styles.descending]: sortDirection === 'descending',
    });
  };

  const getSortIcon = (key: string) => {
    if (sortDirection === 'descending') {
      return <IconSortDescending aria-label={t(`${T_PATH}.ariaDescending`)} className={styles.sortArrow} />;
    }
    return <IconSortAscending aria-label={t(`${T_PATH}.ariaAscending`)} className={styles.sortArrow} />;
  };

  const renderTableHeaders = () => (
    <thead className={styles.customerTableHeader}>
      <tr>
        <th className={cx(styles.customerTableHeaderCell, styles.customerTableHeaderCellButton)}>
          <button
            data-testid="sortButton"
            type="button"
            onClick={() => requestSort()}
            className={apartmentSortClasses()}
          >
            <span>{t(`${T_PATH}.customer`)}</span>
            {getSortIcon('lastName')}
          </button>
        </th>
        <th className={styles.customerTableHeaderCell}>{t(`${T_PATH}.email`)}</th>
        <th className={styles.customerTableHeaderCell}>{t(`${T_PATH}.phone`)}</th>
        <th className={styles.customerTableHeaderCell}>{t(`${T_PATH}.coApplicant`)}</th>
        <th className={styles.customerTableHeaderCell}>{t(`${T_PATH}.rightOfResidence`)}</th>
      </tr>
    </thead>
  );

  return (
    <>
      <div className={styles.customerTableWrapper}>
        <table className={styles.customerTable}>
          {renderTableHeaders()}
          {hasSearchQuery && !isLoading && !!sortedCustomers.length && (
            <tbody>
              {sortedCustomers.map((c) => (
                <CustomerTableRow key={c.id} customer={c} />
              ))}
            </tbody>
          )}
        </table>
      </div>
      {!hasSearchQuery && (
        <div className={styles.messageWrapper}>
          <StatusText>{t(`${T_PATH}.noSearchQuery`)}</StatusText>
        </div>
      )}
      {hasSearchQuery && isLoading && (
        <div className={styles.messageWrapper}>
          <LoadingSpinner loadingText={t(`${T_PATH}.loading`)} />
        </div>
      )}
      {hasSearchQuery && !isLoading && sortedCustomers?.length === 0 && (
        <div className={styles.messageWrapper}>
          <StatusText>{t(`${T_PATH}.noResults`)}</StatusText>
        </div>
      )}
    </>
  );
};

export default CustomerTable;
