import React from 'react';
import { useTranslation } from 'react-i18next';

import { AddEditCostIndex } from '../../types';
import formatDateTime from '../../utils/formatDateTime';

import styles from './CostIndexSingleTable.module.scss';

const T_PATH = 'components.costindex.CostIndexSingleTable';

interface Props {
  costIndex: AddEditCostIndex;
}

const CostIndexSingleTable = ({ costIndex }: Props): JSX.Element => {
  const { t: translate } = useTranslation();
  const t = (label: string) => translate(`${T_PATH}.${label}`);

  return (
    <table className={styles.costIndexInfoTable}>
      <tbody>
        <tr>
          <th>{t('date')}</th>
          <td>{formatDateTime(costIndex.valid_from, true)}</td>
        </tr>
        <tr>
          <th>{t('index')}</th>
          <td>{costIndex.value}</td>
        </tr>
      </tbody>
    </table>
  );
};

export default CostIndexSingleTable;
