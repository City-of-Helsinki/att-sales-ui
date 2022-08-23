import React from 'react';
import { useTranslation } from 'react-i18next';

import Container from '../../components/common/container/Container';
import SalesReport from '../../components/reports/SalesReport';
import { usePageTitle } from '../../utils/usePageTitle';

const T_PATH = 'pages.reports.Reports';

const Reports = (): JSX.Element => {
  const { t } = useTranslation();

  usePageTitle(t('PAGES.reports'));

  return (
    <>
      <Container>
        <h1>{t(`${T_PATH}.reportsPageTitle`)}</h1>
      </Container>
      <SalesReport />
    </>
  );
};

export default Reports;
