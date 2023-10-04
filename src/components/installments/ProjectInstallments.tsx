import React, { useState, useEffect } from 'react';
import cx from 'classnames';
import moment from 'moment';
import Big from 'big.js';
import { Button, Notification, Select, TextInput } from 'hds-react';
import { useTranslation } from 'react-i18next';

import StatusText from '../common/statusText/StatusText';
import { Project, ProjectInstallment, ProjectInstallmentInputRow, SelectOption } from '../../types';
import {
  InstallmentTypes,
  HasoInstallmentPercentageSpecifiers,
  HitasInstallmentPercentageSpecifiers,
} from '../../enums';
import { useGetProjectInstallmentsQuery, useSetProjectInstallmentsMutation } from '../../redux/services/api';
import parseApiErrors from '../../utils/parseApiErrors';
import { toast } from '../common/toast/ToastManager';

import styles from './ProjectInstallments.module.scss';

const T_PATH = 'components.installments.ProjectInstallments';

interface IProps {
  uuid: Project['uuid'];
  ownershipType: Project['ownership_type'];
  barred_bank_account?: Project['barred_bank_account'];
  regular_bank_account?: Project['regular_bank_account'];
}

const unitOptions = {
  UNIT_AS_EURO: 'UNIT_AS_EURO',
  UNIT_AS_PERCENTAGE: 'UNIT_AS_PERCENTAGE',
} as const;

const ProjectInstallments = ({
  uuid,
  ownershipType,
  barred_bank_account,
  regular_bank_account,
}: IProps): JSX.Element => {
  const { t } = useTranslation();
  const {
    data: installments,
    isFetching,
    isLoading,
    isError,
    isSuccess,
    refetch,
  } = useGetProjectInstallmentsQuery(uuid);
  const [setProjectInstallments, { isLoading: postInstallmentsLoading }] = useSetProjectInstallmentsMutation();
  const [formData, setFormData] = useState<ProjectInstallment[]>([]); // Form data to be sent to the API
  const [inputFields, setInputFields] = useState<ProjectInstallmentInputRow[]>([]); // Form input field values
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  // Render saved installment data into inputFields
  useEffect(() => {
    if (installments) {
      const emptyInputRow: ProjectInstallmentInputRow = {
        type: '',
        unit: '',
        sum: '',
        percentage_specifier: '',
        account_number: '',
        due_date: '',
      };

      // Create an array with a length of InstallmentTypes ENUMs.
      // Initially fill all array items with emptyInputRow objects
      const initialInputRows = [...new Array(Object.keys(InstallmentTypes).length)].map(() => ({ ...emptyInputRow }));

      // Create a copy of initial input rows
      const installmentRows = [...initialInputRows];

      // Loop through saved installments and replace empty rows with installment data
      installments.forEach((installment, index: number) => {
        installmentRows[index].type = installment.type;
        installmentRows[index].account_number = installment.account_number;
        // Always show Finnish locale values in the date input field
        installmentRows[index].due_date =
          installment.due_date !== null ? moment(installment.due_date, 'YYYY-MM-DD').format('D.M.YYYY') : '';

        if (installment.percentage_specifier) {
          installmentRows[index].sum =
            installment.percentage === undefined || installment.percentage === null ? '' : installment.percentage;
          installmentRows[index].percentage_specifier = installment.percentage_specifier;
          installmentRows[index].unit = unitOptions.UNIT_AS_PERCENTAGE;
        } else {
          installmentRows[index].sum =
            installment.amount === undefined || installment.amount === null
              ? ''
              : (installment.amount / 100).toFixed(2);
          installmentRows[index].unit = unitOptions.UNIT_AS_EURO;
        }
      });

      // Sort filled input rows in the order of the InstallmentTypes ENUM list and leave empty rows last
      const sortedInputRows = () => {
        const InstallmentOrder = Object.values(InstallmentTypes);
        return installmentRows.sort((a, b) =>
          a.type
            ? b.type
              ? InstallmentOrder.indexOf(a.type as InstallmentTypes) -
                InstallmentOrder.indexOf(b.type as InstallmentTypes)
              : -1
            : 1
        );
      };

      // Set initial inputRows after fetching all the saved installments
      setInputFields(sortedInputRows);
    }
  }, [installments]);

  // // Set data to be sent to the API
  useEffect(() => {
    // Create a copy of inputFields
    const inputs = [...inputFields];

    // Filter out empty rows.
    // Row is considered as filled if any of row.type, row.account_number or row.sum has a value
    const nonEmptyRows = inputs.filter((row) => row.type !== '' || row.account_number !== '' || row.sum !== '');

    const getFormattedSum = (sum: string, asPercentage: boolean) => {
      const replaced = sum.replaceAll(',', '.'); // convert all commas to dots
      try {
        const value = new Big(replaced);
        if (asPercentage) {
          return value.toString();
        }
        return value.mul(100).round().toNumber();
      } catch (e) {
        return sum;
      }
    };

    // Map input field data to use correct format for the API
    const apiData = nonEmptyRows.map((row) => {
      // Define using either of amount (€) or percentage values -- or neither if flexible
      let sumFields;
      if (row.percentage_specifier === HitasInstallmentPercentageSpecifiers.SalesPriceFlexible) {
        sumFields = { percentage_specifier: row.percentage_specifier };
      } else if (row.unit === unitOptions.UNIT_AS_PERCENTAGE) {
        sumFields = { percentage: getFormattedSum(row.sum, true), percentage_specifier: row.percentage_specifier };
      } else {
        sumFields = { amount: getFormattedSum(row.sum, false) };
      }

      // Use date format of YYYY-MM-DD if there's a valid date
      const formattedDate =
        moment(row.due_date, 'D.M.YYYY', true).isValid() && moment(row.due_date, 'D.M.YYYY', true).format('YYYY-MM-DD');
      // use either formatted due date, null for an empty value or row.due_date value if it was filled in and not a valid date
      const dueDate = formattedDate ? formattedDate : row.due_date === '' ? null : row.due_date;

      return {
        type: row.type,
        account_number: row.account_number,
        due_date: dueDate,
        ...sumFields,
      };
    }) as ProjectInstallment[];

    // Set formatted apiData to formData
    setFormData(apiData);
  }, [inputFields]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // prevent page reloads

    if (!postInstallmentsLoading) {
      try {
        // Send form data to API
        await setProjectInstallments({ formData, uuid })
          .unwrap()
          .then(() => {
            setErrorMessages([]); // Clear any error messages
            // Show success toast
            toast.show({ type: 'success', content: t(`${T_PATH}.formSentSuccessfully`) });
            // Refetch installments data from API after form was successfully submitted
            refetch();
          });
      } catch (err: any) {
        setErrorMessages(parseApiErrors(err));
      }
    }
  };

  const handleInputChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const inputs = [...inputFields];
    inputs[index][event.target.name as keyof ProjectInstallmentInputRow] = event.target.value;
    setInputFields(inputs);
  };

  const handleSelectChange = (index: number, selectedOption: SelectOption) => {
    const inputs = [...inputFields];
    inputs[index][selectedOption.name as keyof ProjectInstallmentInputRow] = selectedOption.selectValue;
    setInputFields(inputs);
  };

  // TODO: Add datepicker
  // const handleDatePickerChange = (index: number, value: string) => {
  //   const inputs = [...inputFields];
  //   inputs[index].due_date = value;
  //   setInputFields(inputs);
  // };

  const isPercentageRow = (index: number) => {
    return inputFields[index].unit === unitOptions.UNIT_AS_PERCENTAGE;
  };

  const isFlexibleInstallmentRow = (index: number) => {
    return inputFields[index].percentage_specifier === HitasInstallmentPercentageSpecifiers.SalesPriceFlexible;
  };

  const InstallmentTypeOptions = () => {
    // Define an empty value as the first dropdown item
    let options: SelectOption[] = [{ label: '', name: 'type', selectValue: '' }];
    // Loop through InstallmentTypes ENUMs and create dropdown options out of them
    Object.values(InstallmentTypes).forEach((type) => {
      options.push({ label: t(`ENUMS.InstallmentTypes.${type}`), name: 'type', selectValue: type });
    });
    return options;
  };

  const InstallmentUnitOptions: SelectOption[] = [
    { label: '€', name: 'unit', selectValue: unitOptions.UNIT_AS_EURO },
    { label: t(`${T_PATH}.fromPrice`), name: 'unit', selectValue: unitOptions.UNIT_AS_PERCENTAGE },
  ];

  const InstallmentPercentageSpecifierOptions = () => {
    let options: SelectOption[] = [];
    // Loop through either Hitas or Haso InstallmentPercentageSpecifiers ENUM based on project ownership type,
    // and create dropdown options out of them
    if (ownershipType === 'haso') {
      Object.values(HasoInstallmentPercentageSpecifiers).forEach((type) => {
        options.push({
          label: t(`ENUMS.HasoInstallmentPercentageSpecifiers.${type}`),
          name: 'percentage_specifier',
          selectValue: type,
        });
      });
    } else {
      Object.values(HitasInstallmentPercentageSpecifiers).forEach((type) => {
        options.push({
          label: t(`ENUMS.HitasInstallmentPercentageSpecifiers.${type}`),
          name: 'percentage_specifier',
          selectValue: type,
        });
      });
    }
    return options;
  };

  // Define initial empty select option
  const emptySelectOption: SelectOption = {
    label: '',
    name: '',
    selectValue: '',
  };

  const renderTableHeader = () => (
    <thead>
      <tr>
        <th style={{ width: '230px' }}>{t(`${T_PATH}.installmentType`)}</th>
        <th style={{ width: '150px' }}>{t(`${T_PATH}.amount`)}</th>
        <th style={{ width: '170px' }}>{t(`${T_PATH}.unit`)}</th>
        <th style={{ width: '240px' }}>{t(`${T_PATH}.unitSpecifier`)}</th>
        <th>{t(`${T_PATH}.IbanAccountNumber`)}</th>
        <th style={{ width: '170px' }}>{t(`${T_PATH}.dueDate`)}</th>
      </tr>
    </thead>
  );

  const renderTableContent = () => (
    <tbody className="hds-table__content">
      {inputFields.map((input, index) => (
        <tr key={index}>
          <td>
            <Select
              id={`type-${index}`}
              placeholder={t(`${T_PATH}.select`)}
              label=""
              className={styles.select}
              options={InstallmentTypeOptions()}
              value={InstallmentTypeOptions().find((value) => value.selectValue === input.type) || emptySelectOption}
              onChange={(value: SelectOption) => handleSelectChange(index, value)}
            />
          </td>
          <td>
            <TextInput
              type="number"
              pattern="[0-9]+([\.,][0-9]+)?"
              id={`sum-${index}`}
              name="sum"
              label=""
              className={styles.input}
              value={!isFlexibleInstallmentRow(index) ? input.sum : ''}
              onChange={(event) => handleInputChange(index, event)}
              disabled={isFlexibleInstallmentRow(index)}
            />
          </td>
          <td>
            <Select
              id={`unit-${index}`}
              placeholder={!isFlexibleInstallmentRow(index) ? t(`${T_PATH}.select`) : ''}
              label=""
              className={styles.select}
              options={InstallmentUnitOptions}
              value={
                isFlexibleInstallmentRow(index)
                  ? emptySelectOption
                  : InstallmentUnitOptions.find((value) => value.selectValue === input.unit) || emptySelectOption
              }
              onChange={(value: SelectOption) => handleSelectChange(index, value)}
              disabled={isFlexibleInstallmentRow(index)}
            />
          </td>
          <td>
            <Select
              id={`unitSpecifier-${index}`}
              placeholder={isPercentageRow(index) ? t(`${T_PATH}.select`) : ''}
              label=""
              className={styles.select}
              options={InstallmentPercentageSpecifierOptions()}
              value={
                isPercentageRow(index)
                  ? InstallmentPercentageSpecifierOptions().find(
                      (value) => value.selectValue === input.percentage_specifier
                    ) || emptySelectOption
                  : emptySelectOption
              }
              onChange={(value: SelectOption) => handleSelectChange(index, value)}
              disabled={!isPercentageRow(index)}
            />
          </td>
          <td>
            <TextInput
              id="accountNumber"
              name="account_number"
              label=""
              className={styles.input}
              value={input.account_number}
              onChange={(event) => handleInputChange(index, event)}
            />
          </td>
          <td>
            {/* TODO: Add datepicker. It is disabled now because of bad CPU performance
            <DateInput
              id="dueDate"
              name="due_date"
              placeholder={t(`${T_PATH}.select`)}
              initialMonth={new Date()}
              label=""
              className={styles.input}
              language={getCurrentLangCode()}
              disableConfirmation
              value={input.due_date}
              onChange={(value) => handleDatePickerChange(index, value)}
            />
            */}
            <TextInput
              id="dueDate"
              name="due_date"
              placeholder={t('d.m.yyyy')}
              label=""
              className={styles.input}
              value={input.due_date}
              onChange={(event) => handleInputChange(index, event)}
            />
          </td>
        </tr>
      ))}
    </tbody>
  );

  if (isLoading) return <StatusText>{t(`${T_PATH}.loading`)}...</StatusText>;

  if (isError) {
    return (
      <Notification type="error" size="small" style={{ marginTop: 15 }}>
        {t(`${T_PATH}.errorLoadingInstallments`)}
      </Notification>
    );
  }

  return (
    <>
      <table className={styles.bankAccounts}>
        <tbody>
          <tr>
            <th>{t(`${T_PATH}.regularBankAccount`)}</th>
            <td>{regular_bank_account ? regular_bank_account : '-'}</td>
          </tr>
          <tr>
            <th>{t(`${T_PATH}.barredBankAccount`)}</th>
            <td>{barred_bank_account ? barred_bank_account : '-'}</td>
          </tr>
        </tbody>
      </table>
      {!!errorMessages.length && (
        <Notification type="error" style={{ margin: '15px 0' }}>
          <ul>
            {errorMessages.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Notification>
      )}
      <form className={cx(styles.form, isFetching && styles.disabled)} onSubmit={handleSubmit}>
        {isSuccess && installments && (
          <>
            <div className={styles.tableWrapper}>
              <table className={cx(styles.installmentsTable, 'hds-table hds-table--light')}>
                {renderTableHeader()}
                {renderTableContent()}
              </table>
            </div>
            <div className={styles.buttons}>
              <Button
                type="submit"
                variant="primary"
                isLoading={postInstallmentsLoading}
                loadingText={t(`${T_PATH}.save`)}
              >
                {t(`${T_PATH}.save`)}
              </Button>
            </div>
          </>
        )}
      </form>
    </>
  );
};

export default ProjectInstallments;
