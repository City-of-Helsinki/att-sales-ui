import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { debounce } from 'lodash';
import { Select, Option, SearchResult, TextInput, IconSearch } from 'hds-react';
import { useTranslation } from 'react-i18next';

import { CustomerListItem } from '../../types';
import { useLazyGetCustomersQuery } from '../../redux/services/api';
import styles from './SelectCustomerDropdown.module.scss';

const T_PATH = 'components.customers.SelectCustomerDropdown';
const SEARCH_KEYWORD_MIN_LENGTH = 2;
const NAME_SEARCH_FIELDS = ['last_name', 'first_name'] as const;
const HETU_REGEXP = /^\d{6}[+\-A]\d{3}[0-9A-Y]$/i;
const DATE_OF_BIRTH_REGEXP = /^\d{1,2}\.\d{1,2}\.\d{4}$/;
const EMAIL_REGEXP = /^\S+@\S*$/;

const getSearchParam = (
  field: 'last_name' | 'first_name' | 'hetu' | 'date_of_birth' | 'email',
  value: string
): string => `${field}=${encodeURIComponent(value)}`;

const isCustomerListItem = (customer: unknown): customer is CustomerListItem => {
  return Boolean(
    customer && typeof customer === 'object' && 'id' in customer && (customer as { id?: unknown }).id != null
  );
};

const getSearchRequests = (
  keyword: string
): Array<{ field: 'last_name' | 'first_name' | 'hetu' | 'date_of_birth' | 'email'; value: string }> => {
  if (EMAIL_REGEXP.test(keyword)) {
    return [{ field: 'email', value: keyword }];
  }

  if (HETU_REGEXP.test(keyword)) {
    return [{ field: 'hetu', value: keyword }];
  }

  if (DATE_OF_BIRTH_REGEXP.test(keyword)) {
    return [{ field: 'date_of_birth', value: keyword }];
  }

  return NAME_SEARCH_FIELDS.map((field) => ({ field, value: keyword }));
};

interface IProps {
  handleSelectCallback: (customerId: string) => void;
  errorMessage?: string;
  hasError?: boolean;
  helpText?: string;
  // Controls whether the search-results Select is forced open. Defaults to true
  // to preserve the existing "search and pick" UX; the calling form can set
  // it to false (e.g. once a preview is active) so the option list collapses.
  isOpen?: boolean;
  // Project ownership type from the calling context. When set to "haso" (case
  // insensitive), customers without a right_of_residence number are filtered
  // out because they cannot be placed in a HASO apartment queue.
  ownershipType?: string;
}

export const filterCustomersForOwnershipType = (
  customers: CustomerListItem[],
  ownershipType?: string
): CustomerListItem[] => {
  if ((ownershipType || '').toLowerCase() !== 'haso') {
    return customers;
  }
  return customers.filter(
    (customer) => customer.right_of_residence !== null && customer.right_of_residence !== undefined
  );
};

const SelectCustomerDropdown = ({
  handleSelectCallback,
  errorMessage,
  hasError,
  helpText,
  isOpen = true,
  ownershipType,
}: IProps) => {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState<string>('');
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [selectedOption, setSelectedOption] = useState<Option | undefined>(undefined);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [hasSearchError, setHasSearchError] = useState(false);
  const latestSearchRef = useRef(0);
  const trimmedSearchValue = searchValue.trim();
  const [triggerGetCustomersByLastName] = useLazyGetCustomersQuery();
  const [triggerGetCustomersByFirstName] = useLazyGetCustomersQuery();
  const [triggerGetCustomersByHetu] = useLazyGetCustomersQuery();
  const [triggerGetCustomersByDateOfBirth] = useLazyGetCustomersQuery();
  const [triggerGetCustomersByEmail] = useLazyGetCustomersQuery();

  const searchCustomers = useCallback(
    async (keyword: string) => {
      const trimmedKeyword = keyword.trim();

      if (trimmedKeyword.length < SEARCH_KEYWORD_MIN_LENGTH) {
        setCustomers([]);
        setHasSearchError(false);
        setIsLoadingCustomers(false);
        return;
      }

      const searchId = latestSearchRef.current + 1;
      latestSearchRef.current = searchId;
      setIsLoadingCustomers(true);
      setHasSearchError(false);
      const searchRequests = getSearchRequests(trimmedKeyword);

      try {
        const responses = await Promise.allSettled(
          searchRequests.map(({ field, value }) => {
            const searchParam = getSearchParam(field, value);

            if (field === 'last_name') {
              return triggerGetCustomersByLastName(searchParam).unwrap();
            }

            if (field === 'first_name') {
              return triggerGetCustomersByFirstName(searchParam).unwrap();
            }

            if (field === 'hetu') {
              return triggerGetCustomersByHetu(searchParam).unwrap();
            }

            if (field === 'email') {
              return triggerGetCustomersByEmail(searchParam).unwrap();
            }

            return triggerGetCustomersByDateOfBirth(searchParam).unwrap();
          })
        );

        if (latestSearchRef.current !== searchId) {
          return;
        }

        const successfulResponses = responses
          .filter((response): response is PromiseFulfilledResult<CustomerListItem[]> => response.status === 'fulfilled')
          .flatMap((response) => (Array.isArray(response.value) ? response.value : []))
          .filter(isCustomerListItem);

        const uniqueCustomers = successfulResponses.filter(
          (customer, index, array) => array.findIndex((entry) => entry.id === customer.id) === index
        );

        setCustomers(uniqueCustomers);
        setHasSearchError(responses.every((response) => response.status === 'rejected'));
      } catch {
        if (latestSearchRef.current !== searchId) {
          return;
        }

        setCustomers([]);
        setHasSearchError(true);
      } finally {
        if (latestSearchRef.current === searchId) {
          setIsLoadingCustomers(false);
        }
      }
    },
    [
      triggerGetCustomersByDateOfBirth,
      triggerGetCustomersByEmail,
      triggerGetCustomersByFirstName,
      triggerGetCustomersByHetu,
      triggerGetCustomersByLastName,
    ]
  );

  useEffect(() => {
    // Construct label that is visible as a single dropdown option
    const getLabel = (customer: CustomerListItem) => {
      const nameParts = (ln: string | null | undefined, fn: string | null | undefined) =>
        [ln, fn].filter((v) => v && v.trim() !== '-').join(', ');
      const primaryName = nameParts(customer.primary_last_name, customer.primary_first_name) || '-';
      const secondaryName = nameParts(customer.secondary_last_name, customer.secondary_first_name);
      let label = `${primaryName} - ${customer.primary_email}`;
      if (secondaryName) {
        label = `${label}; ${secondaryName}`;
      }
      return label.concat(` - ID: ${customer.id}`);
    };

    // Create dropdown options from found customers
    const mapOptions = (customerList: CustomerListItem[]): Option[] => {
      let list: Option[] = [];

      customerList.forEach((customer) => {
        list.push({
          label: getLabel(customer),
          value: customer.id.toString(),
          visible: true,
          disabled: false,
          selected: false,
          isGroupLabel: false,
        });
      });

      return list;
    };

    // Show one disabled option with label "loading" while fetching the customers
    if (isLoadingCustomers) {
      return setOptions([
        {
          label: t(`${T_PATH}.loading`),
          value: '',
          disabled: true,
          selected: true,
          isGroupLabel: false,
          visible: true,
        },
      ]);
    }

    // Set dropdown options empty if:
    // - The search keyword is too short
    // - There's an error while fetching customers
    // - No success state in customer fetching
    if (trimmedSearchValue.length < SEARCH_KEYWORD_MIN_LENGTH || hasSearchError) {
      return setOptions([]);
    }

    // Show one disabled option with label "no results" when there's no results from the query
    if (customers.length === 0) {
      return setOptions([
        {
          label: t(`${T_PATH}.noResults`),
          value: '',
          disabled: true,
          selected: true,
          isGroupLabel: false,
          visible: true,
        },
      ]);
    }

    // For successfull results, display found customers as dropdown options
    const eligibleCustomers = filterCustomersForOwnershipType(customers, ownershipType);
    if (eligibleCustomers.length === 0) {
      const noEligibleHasoCustomers = (ownershipType || '').toLowerCase() === 'haso' && customers.length > 0;

      return setOptions([
        {
          label: noEligibleHasoCustomers ? t(`${T_PATH}.noEligibleHasoResults`) : t(`${T_PATH}.noResults`),
          value: '',
          disabled: true,
          selected: true,
          isGroupLabel: false,
          visible: true,
        },
      ]);
    }

    const customerOptions = mapOptions(eligibleCustomers);
    setOptions(customerOptions);
  }, [customers, ownershipType, trimmedSearchValue, hasSearchError, isLoadingCustomers, t]);

  // Use debounce to optimize the number of calls to the backend while typing rapidly
  const debouncedSearch = useMemo(
    () =>
      debounce((searchKeyword: string) => {
        searchCustomers(searchKeyword);
      }, 500),
    [searchCustomers]
  );

  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  // Use debounced search keyword setting for the backend and return all of the found options
  const handleSearch = useCallback(
    async (searchKeyword: string, selectOptions: Option[]): Promise<SearchResult> => {
      setSearchValue(searchKeyword);
      debouncedSearch(searchKeyword);
      return { options: selectOptions };
    },
    [debouncedSearch]
  );

  // Drop the locally tracked selection when it no longer matches a usable
  // option (e.g. the user typed a new search and the option list changed).
  useEffect(() => {
    setSelectedOption((previous) => {
      if (!previous) return previous;
      const stillSelectable = options.some(
        (option) => option.value === previous.value && !option.disabled && option.value !== ''
      );
      return stillSelectable ? previous : undefined;
    });
  }, [options]);

  // Set the selected customer's ID, and track it locally so the Select keeps
  // showing the selected option even after the parent re-renders (e.g. when
  // pressing "Lisää" to enter the preview state).
  const handleSelectChange = (selected: Option | undefined) => {
    if (!selected || !selected.value) {
      setSelectedOption(undefined);
      return handleSelectCallback('');
    }
    setSelectedOption(selected);
    return handleSelectCallback(selected.value);
  };

  const renderHelpText = () => {
    if (helpText) {
      return helpText + ' ' + t(`${T_PATH}.searchByMultipleFields`);
    }

    return t(`${T_PATH}.searchByMultipleFields`);
  };

  return (
    /* Quick fix while refactoring. Select-component's own searchfield doesn't retain
    its search value between searches when using a debounced search 
    which leads to a janky user experience. -> use a separate TextInput
    **/
    <div className={styles.inputWrapper}>
      <TextInput
        buttonIcon={<IconSearch />}
        type="search"
        id={'searchCustomer'}
        placeholder={t(`${T_PATH}.searchByName`)}
        label={t(`${T_PATH}.selectCustomer`)}
        helperText={renderHelpText()}
        onChange={(e) => {
          handleSearch(e.target.value, options);
        }}
      />
      {searchValue && (
        <Select
          texts={{
            error: errorMessage || `${T_PATH}.errorLoadingCustomers`,
            label: t(`${T_PATH}.selectCustomer`),
          }}
          required
          id="selectCustomer"
          placeholder={t(`${T_PATH}.searchByName`)}
          invalid={hasSearchError || hasError}
          options={options}
          onChange={(selected: Option[], clickedOption: Option) => handleSelectChange(clickedOption)}
          value={selectedOption ? [selectedOption] : undefined}
          open={isOpen}
          visibleOptions={8}
          clearable
        />
      )}
    </div>
  );
};

export default SelectCustomerDropdown;
