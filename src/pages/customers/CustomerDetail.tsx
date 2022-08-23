import React from 'react';
import cx from 'classnames';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconPenLine, Notification, Tabs, TabList, Tab, TabPanel } from 'hds-react';

import Breadcrumbs, { BreadcrumbItem } from '../../components/common/breadcrumbs/Breadcrumbs';
import Container from '../../components/common/container/Container';
import CustomerInfo from '../../components/customers/CustomerInfo';
import Installments from '../../components/installments/Installments';
import CustomerReservations from '../../components/reservations/CustomerReservations';
import Spinner from '../../components/common/spinner/Spinner';
import { ROUTES } from '../../enums';
import { useGetCustomerByIdQuery } from '../../redux/services/api';
import { Customer } from '../../types';
import { usePageTitle } from '../../utils/usePageTitle';

import styles from './CustomerDetail.module.scss';

const T_PATH = 'pages.customers.CustomerDetail';

const CustomerDetail = (): JSX.Element | null => {
  const { t } = useTranslation();
  const { customerId } = useParams();
  const { data: customer, isLoading, isFetching, isError, isSuccess } = useGetCustomerByIdQuery(customerId || '0');

  usePageTitle(customer?.id ? `${t('PAGES.customers')} - ${customer.id}` : t('PAGES.customers'));

  const breadcrumbAncestors: BreadcrumbItem[] = [
    {
      label: t(`${T_PATH}.customers`),
      path: `/${ROUTES.CUSTOMERS}`,
    },
  ];

  const currentBreadcrumb = (currentCustomer?: Customer) => {
    let breadcrumb = '';

    if (customerId) {
      breadcrumb = customerId;
    }

    if (currentCustomer) {
      const primary = `${currentCustomer.primary_profile.last_name}, ${currentCustomer.primary_profile.first_name}`;
      let combined = primary;
      if (currentCustomer.secondary_profile) {
        combined =
          primary +
          ` (${currentCustomer.secondary_profile.last_name}, ${currentCustomer.secondary_profile.first_name})`;
      }
      breadcrumb = combined;
    }

    return breadcrumb;
  };

  const renderBreadcrumb = () => <Breadcrumbs current={currentBreadcrumb(customer)} ancestors={breadcrumbAncestors} />;

  if (isLoading) {
    return (
      <Container>
        {renderBreadcrumb()}
        <Spinner />
      </Container>
    );
  }

  if (isError) {
    return (
      <Container>
        {renderBreadcrumb()}
        <Notification type="error" size="small" style={{ marginTop: 15 }}>
          {t(`${T_PATH}.errorLoadingCustomer`)}
        </Notification>
      </Container>
    );
  }

  if (!isSuccess || !customer) return null;

  return (
    <>
      <Container>{renderBreadcrumb()}</Container>
      {isFetching && (
        <div className={styles.fixedSpinner}>
          <Container className={styles.loadingSpinnerContainer}>
            <Spinner />
          </Container>
        </div>
      )}
      <Container className={cx(isFetching && styles.disabled)}>
        <div className={styles.titleRow}>
          <h1>{t(`${T_PATH}.customerDetails`)}</h1>
          <div className={styles.customerEditLink}>
            <a
              href={`/${ROUTES.CUSTOMERS}/edit/${customerId}`}
              className={cx(styles.editBtn, 'hds-button hds-button--secondary hds-button--small')}
            >
              <span aria-hidden="true" className="hds-icon">
                <IconPenLine />
              </span>
              <span className="hds-button__label">{t(`${T_PATH}.editCustomerBtn`)}</span>
            </a>
          </div>
        </div>
        <CustomerInfo customer={customer} />
        <div className={styles.tabsWrapper}>
          <Tabs>
            <TabList className={styles.tabs}>
              <Tab>{t(`${T_PATH}.tabReservations`)}</Tab>
              <Tab>{t(`${T_PATH}.tabInstallments`)}</Tab>
            </TabList>
            <TabPanel className={styles.tabPanel}>
              <CustomerReservations customer={customer} />
            </TabPanel>
            <TabPanel className={styles.tabPanel}>
              <Installments customer={customer} />
            </TabPanel>
          </Tabs>
        </div>
      </Container>
    </>
  );
};

export default CustomerDetail;
