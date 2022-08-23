import React from 'react';
import cx from 'classnames';
import { IconSortAscending, IconSortDescending } from 'hds-react';
import { useTranslation } from 'react-i18next';

import ApartmentRow from './ApartmentRow';
import useSortApartments from '../../utils/useSortApartments';
import StatusText from '../common/statusText/StatusText';
import { Apartment, Project } from '../../types';

import styles from './ApartmentTable.module.scss';

const T_PATH = 'components.apartment.ApartmentTable';

interface IProps {
  apartments: Apartment[] | undefined;
  hasActiveFilters: boolean;
  project: Project;
  ownershipType: Project['ownership_type'];
  housingCompany: Project['housing_company'];
  isLotteryCompleted: boolean;
}

const ApartmentTable = ({
  apartments,
  hasActiveFilters,
  housingCompany,
  ownershipType,
  project,
  isLotteryCompleted,
}: IProps): JSX.Element => {
  const { t } = useTranslation();
  const { sortedApartments, requestSort, sortConfig } = useSortApartments(
    apartments ? apartments : [],
    `project-${project.uuid}`
  );

  const isCurrentlyActiveSort = (key: string) => {
    return sortConfig ? sortConfig.key === key : false;
  };

  const getSortDirectionFor = (name: string) => {
    if (!sortConfig) return;
    return sortConfig?.key === name ? sortConfig.direction : undefined;
  };

  const apartmentSortClasses = (key: string) => {
    return cx(styles.sortButton, {
      [styles.activeSort]: isCurrentlyActiveSort(key),
      [styles.ascending]: getSortDirectionFor(key) === 'ascending',
      [styles.descending]: getSortDirectionFor(key) === 'descending',
    });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig) return;
    if (getSortDirectionFor(key) === 'descending') {
      return <IconSortDescending aria-label={t(`${T_PATH}.ariaDescending`)} className={styles.sortArrow} />;
    }
    return <IconSortAscending aria-label={t(`${T_PATH}.ariaAscending`)} className={styles.sortArrow} />;
  };

  const tableHeadButton = (sortKey: string, buttonLabel: string, sortAsAlphaNumeric: boolean) => {
    return (
      <button
        type="button"
        onClick={() => requestSort(sortKey, sortAsAlphaNumeric)}
        className={apartmentSortClasses(sortKey)}
      >
        <span className="hiddenFromScreen">
          {isCurrentlyActiveSort(sortKey) ? t(`${T_PATH}.ariaIsActiveSort`) : t(`${T_PATH}.ariaSetSort`)},&nbsp;
        </span>
        <span>{buttonLabel}</span>
        {getSortIcon(sortKey)}
      </button>
    );
  };

  return (
    <div
      className={styles.apartmentList}
      role="group"
      aria-label={`${t(`${T_PATH}.ariaApartmentListForProject`)}: ${housingCompany}`}
    >
      <ul className={styles.apartmentListTable}>
        {!sortedApartments.length ? (
          <li key="apartment-list-empty">
            <StatusText>
              {t(`${T_PATH}.noApartments`)}
              {hasActiveFilters && ` ` + t(`${T_PATH}.withSelectedFilters`)}
            </StatusText>
          </li>
        ) : (
          <>
            <li
              className={styles.apartmentListHeaders}
              aria-label={t(`${T_PATH}.ariaSortApartments`)}
              key="apartment-list-header"
            >
              <div className={cx(styles.headerCell, styles.headerCellSortable, styles.headerCellApartment)}>
                {tableHeadButton('apartment_number', t(`${T_PATH}.apartment`), true)}
              </div>
              <div className={styles.headerCellParent}>
                <div className={cx(styles.headerCell, styles.headerCellHalf)}>
                  {isLotteryCompleted ? t(`${T_PATH}.priorityOrder`) : t(`${T_PATH}.applicants`)}
                </div>
                <div className={cx(styles.headerCell, styles.headerCellHalf)}>
                  {ownershipType === 'haso' ? t(`${T_PATH}.hasoNumber`) : t(`${T_PATH}.familyWithChildren`)}
                </div>
              </div>
            </li>
            {sortedApartments.map((apartment, index) => (
              <ApartmentRow
                key={index}
                apartment={apartment}
                ownershipType={ownershipType}
                isLotteryCompleted={isLotteryCompleted}
                project={project}
              />
            ))}
          </>
        )}
      </ul>
    </div>
  );
};

export default ApartmentTable;
