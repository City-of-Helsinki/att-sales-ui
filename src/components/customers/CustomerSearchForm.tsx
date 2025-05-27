import React, { useState } from 'react';
import { Button, IconSearch, TextInput } from 'hds-react';
import { useTranslation } from 'react-i18next';

import { CustomerSearchFormFields } from '../../types';

import styles from './CustomerSearchForm.module.scss';

const T_PATH = 'components.customers.CustomerSearchForm';

interface IProps {
  searchParams: URLSearchParams;
  handleFormCallback: (formValues: CustomerSearchFormFields) => void;
}

const CustomerSearchForm = ({ searchParams, handleFormCallback }: IProps): JSX.Element => {
  const { t } = useTranslation();
  const [formValues, setFormValues] = useState<CustomerSearchFormFields>({
    first_name: searchParams.get('first_name') || '',
    last_name: searchParams.get('last_name') || '',
    phone_number: searchParams.get('phone_number') || '',
    email: searchParams.get('email') || '',
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleFormCallback(formValues);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const values = { ...formValues };
    values[event.target.name as keyof CustomerSearchFormFields] = event.target.value;
    setFormValues(values);
  };

  return (
    <form className={styles.searchForm} onSubmit={(e) => handleSubmit(e)}>
      <div className={styles.searchFields}>
        <TextInput
          id="customerSearchFormFirstName"
          name="first_name"
          label={t(`${T_PATH}.firstName`)}
          placeholder={t(`${T_PATH}.firstName`)}
          value={formValues.first_name}
          onChange={(e) => handleInputChange(e)}
        />
        <TextInput
          id="customerSearchFormLastName"
          name="last_name"
          label={t(`${T_PATH}.lastName`)}
          placeholder={t(`${T_PATH}.lastName`)}
          value={formValues.last_name}
          onChange={(e) => handleInputChange(e)}
        />
        <TextInput
          id="customerSearchFormPhone"
          name="phone_number"
          label={t(`${T_PATH}.phone`)}
          placeholder={t(`${T_PATH}.phone`)}
          value={formValues.phone_number}
          onChange={(e) => handleInputChange(e)}
        />
        <TextInput
          id="customerSearchFormEmail"
          name="email"
          label={t(`${T_PATH}.email`)}
          placeholder={t(`${T_PATH}.email`)}
          value={formValues.email}
          onChange={(e) => handleInputChange(e)}
        />
      </div>
      <div>
        <Button iconEnd={<IconSearch />} type="submit">
          {t(`${T_PATH}.btnSearch`)}
        </Button>
      </div>
    </form>
  );
};

export default CustomerSearchForm;
