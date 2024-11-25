import React from 'react';
import cx from 'classnames';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { CustomerListItem } from '../../types';
import { ROUTES } from '../../enums';

import styles from './CustomerTableRow.module.scss';

const T_PATH = 'components.customers.CustomerTableRow';

interface IProps {
  customer?: CustomerListItem;
}

const CustomerTableRow = ({ customer }: IProps): JSX.Element => {
  const { t } = useTranslation();

  return (
    <tr className={styles.customerTableRow}>
      <td className={cx(`${styles.customerTableCell} ${styles.nameCell}`)}>
        <Link to={`/${ROUTES.CUSTOMERS}/${customer?.id}`}>
          <span className="visually-hidden">{t(`${T_PATH}.customer`)}:</span>
          {customer?.primary_last_name}, {customer?.primary_first_name}
        </Link>
      </td>
      <td className={styles.customerTableCell}>
        <span className="visually-hidden">{t(`${T_PATH}.email`)}:</span>
        {customer?.primary_email}
      </td>
      <td className={styles.customerTableCell}>
        <span className="visually-hidden">{t(`${T_PATH}.phone`)}:</span>
        {customer?.primary_phone_number}
      </td>
      <td className={styles.customerTableCell}>
        {customer?.secondary_last_name && customer?.secondary_first_name && (
          <>
            <span className="visually-hidden">{t(`${T_PATH}.coApplicant`)}:</span>
            {customer.secondary_last_name}, {customer.secondary_first_name}
          </>
        )}
      </td>
    </tr>
  );
};

export default CustomerTableRow;
