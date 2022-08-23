import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { debounce } from 'lodash';
import { Combobox } from 'hds-react';
import { useTranslation } from 'react-i18next';

import { CustomerListItem, SelectOption } from '../../types';
import { useGetCustomersQuery } from '../../redux/services/api';

const T_PATH = 'components.customers.SelectCustomerDropdown';
const SEARCH_KEYWORD_MIN_LENGTH = 2;

interface IProps {
  handleSelectCallback: (customerId: string) => void;
  errorMessage?: string;
  hasError?: boolean;
  helpText?: string;
}

const SelectCustomerDropdown = ({ handleSelectCallback, errorMessage, hasError, helpText }: IProps) => {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState<string>('');
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [didMount, setDidMount] = useState(false);
  const {
    data: customers,
    isSuccess,
    isError,
    isLoading,
    isFetching,
  } = useGetCustomersQuery(`last_name=${searchValue}`, { skip: searchValue.length < SEARCH_KEYWORD_MIN_LENGTH });

  // Update component mount state
  useEffect(() => {
    setDidMount(true);
    return () => setDidMount(false);
  }, []);

  useEffect(() => {
    // Construct label that is visible as a single dropdown option
    const getLabel = (customer: CustomerListItem) => {
      let label = `${customer.primary_last_name}, ${customer.primary_first_name} - ${customer.primary_email}`;
      if (customer.secondary_last_name) {
        label = `${label}; ${customer.secondary_last_name}, ${customer.secondary_first_name}`;
      }
      return label.concat(` - ID: ${customer.id}`);
    };

    // Create dropdown options from found customers
    const mapOptions = (customerList: CustomerListItem[]): SelectOption[] => {
      let list: SelectOption[] = [];

      customerList.forEach((customer) => {
        list.push({
          label: getLabel(customer),
          name: 'selectCustomer',
          selectValue: customer.id.toString(),
        });
      });

      return list;
    };

    // Show one disabled option with label "loading" while fetching the customers
    if (isLoading || isFetching) {
      return setOptions([
        {
          label: t(`${T_PATH}.loading`),
          name: 'selectCustomer',
          selectValue: '',
          disabled: true,
        },
      ]);
    }

    // Set dropdown options empty if:
    // - The search keyword is too short
    // - There's an error while fetching customers
    // - No success state in customer fetching
    if (searchValue.length < SEARCH_KEYWORD_MIN_LENGTH || isError || !isSuccess) {
      return setOptions([]);
    }

    // Show one disabled option with label "no results" when there's no results from the query
    if (isSuccess && customers?.length === 0) {
      return setOptions([
        {
          label: t(`${T_PATH}.noResults`),
          name: 'selectCustomer',
          selectValue: '',
          disabled: true,
        },
      ]);
    }

    // For successfull results, display found customers as dropdown options
    if (isSuccess && customers) {
      const customerOptions = mapOptions(customers);
      setOptions(customerOptions);
    }
  }, [customers, searchValue, isSuccess, isError, isLoading, isFetching, t]);

  // Use debounce to optimize the number of calls to the backend while typing rapidly
  const debouncedSearch = useMemo(
    () =>
      debounce((searchKeyword: string) => {
        // Wait for the component to mount before trying to update it's state
        if (didMount) {
          setSearchValue(searchKeyword);
        }
      }, 500),
    [setSearchValue, didMount]
  );

  // Use debounced search keyword setting for the backend and return all of the found options
  const handleSearch = useCallback(
    (selectOptions: SelectOption[], searchKeyword: string): SelectOption[] => {
      debouncedSearch(searchKeyword);
      return selectOptions;
    },
    [debouncedSearch]
  );

  // Set the selected customer's ID
  const handleSelectChange = (selected: SelectOption) => {
    if (!selected) {
      return handleSelectCallback('');
    }
    return handleSelectCallback(selected.selectValue);
  };

  const renderHelpText = () => {
    if (helpText) {
      return helpText + ' ' + t(`${T_PATH}.searchByLastNameOnly`);
    }

    return t(`${T_PATH}.searchByLastNameOnly`);
  };

  return (
    <>
      <Combobox
        required
        id="selectCustomer"
        label={t(`${T_PATH}.selectCustomer`)}
        placeholder={t(`${T_PATH}.searchByName`)}
        helper={renderHelpText()}
        toggleButtonAriaLabel={t(`${T_PATH}.toggleMenu`)}
        showToggleButton={searchValue.length >= SEARCH_KEYWORD_MIN_LENGTH}
        invalid={isError || hasError}
        error={errorMessage || `${T_PATH}.errorLoadingCustomers`}
        isOptionDisabled={(item: SelectOption): boolean => !!item.disabled}
        options={options}
        onChange={(selected: SelectOption) => handleSelectChange(selected)}
        multiselect={false}
        filter={handleSearch}
        visibleOptions={8}
        clearable
        virtualized
      />
    </>
  );
};

export default SelectCustomerDropdown;
