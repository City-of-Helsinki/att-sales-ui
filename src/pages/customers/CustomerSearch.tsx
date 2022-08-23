import React from 'react';
import { Notification } from 'hds-react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';

import Container from '../../components/common/container/Container';
import CustomerSearchForm from '../../components/customers/CustomerSearchForm';
import CustomerTable from '../../components/customers/CustomerTable';
import { useGetCustomersQuery } from '../../redux/services/api';
import { CustomerSearchFormFields } from '../../types';
import { usePageTitle } from '../../utils/usePageTitle';
import { ROUTES } from '../../enums';

import styles from './CustomerSearch.module.scss';

const T_PATH = 'pages.customers.CustomerSearch';

const CustomerSearch = (): JSX.Element => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const hasSearchQuery = Array.from(searchParams).length ? true : false;
  const {
    data: customers,
    isError,
    isLoading,
    isFetching,
    refetch,
  } = useGetCustomersQuery(new URLSearchParams(searchParams).toString(), { skip: !hasSearchQuery });

  usePageTitle(t('PAGES.customers'));

  const handleFormCallback = (formValues: CustomerSearchFormFields) => {
    // Filter out all of the unfilled input fields from the formValues object
    const formValuesWithoutEmpty = Object.fromEntries(Object.entries(formValues).filter(([_, value]) => value));
    // Set new search params
    setSearchParams(new URLSearchParams(formValuesWithoutEmpty));
    // Refetch customers list
    refetch();
  };

  return (
    <>
      <Container className={styles.customerSearchTop}>
        <h1 className={styles.pageHeader}>{t(`${T_PATH}.pageTitle`)}</h1>
        <div className={styles.customerFormWrapper}>
          <CustomerSearchForm searchParams={searchParams} handleFormCallback={handleFormCallback} />
          <Link to={`/${ROUTES.ADD_CUSTOMER}`} className={`${styles.createNewBtn} hds-button hds-button--secondary`}>
            <span className="hds-button__label">{t(`${T_PATH}.btnCreateCustomer`)}</span>
          </Link>
        </div>
      </Container>
      {!isLoading && !isFetching && isError && (
        <Container>
          <Notification type="error">{t(`${T_PATH}.errorLoadingCustomers`)}</Notification>
        </Container>
      )}
      {!isError && (
        <Container wide>
          <div className={styles.customerTableContainer}>
            <CustomerTable customers={customers} hasSearchQuery={hasSearchQuery} isLoading={isLoading || isFetching} />
          </div>
        </Container>
      )}
    </>
  );
};

export default CustomerSearch;
