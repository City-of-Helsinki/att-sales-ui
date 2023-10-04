import React from 'react';
import { useTranslation } from 'react-i18next';

import Breadcrumbs from '../../components/common/breadcrumbs/Breadcrumbs';
import Container from '../../components/common/container/Container';
import CostIndexTable from '../../components/costindex/CostIndexTable';
import { ROUTES } from '../../enums';
import { usePageTitle } from '../../utils/usePageTitle';

const T_PATH = 'pages.costindex.CostIndex';

const CostIndex = (): JSX.Element => {
  const { t } = useTranslation();
  const pageTitle = t(`${T_PATH}.costIndexPageTitle`);

  const renderBreadcrumb = () => (
    <Breadcrumbs
      current={pageTitle}
      ancestors={[
        {
          label: t('pages.reports.Reports.reportsPageTitle'),
          path: `/${ROUTES.REPORTS}`,
        },
      ]}
    />
  );

  usePageTitle(t('PAGES.costindex'));

  return (
    <>
      <Container>
        {renderBreadcrumb()}
        <h1>{pageTitle}</h1>
      </Container>
      <CostIndexTable />
    </>
  );
};

export default CostIndex;
