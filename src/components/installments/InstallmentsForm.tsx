import React, { useCallback, useEffect, useState } from 'react';
import cx from 'classnames';
import moment from 'moment';
import Big from 'big.js';
import {
  Button,
  Card,
  IconAlertCircleFill,
  IconAngleDown,
  IconAngleUp,
  IconCheckCircleFill,
  Notification,
  Select,
  TextInput,
  useAccordion,
} from 'hds-react';
import { useTranslation } from 'react-i18next';
import { unionBy } from 'lodash';

import formatDateTime from '../../utils/formatDateTime';
import formattedSalesPrice from '../../utils/formatSalesPrice';
import { InstallmentTypes } from '../../enums';
import {
  ApartmentInstallment,
  ApartmentInstallmentCandidate,
  ApartmentInstallmentInputRow,
  ApartmentReservation,
  SelectOption,
} from '../../types';
import { toast } from '../common/toast/ToastManager';
import { useSetApartmentInstallmentsMutation } from '../../redux/services/api';

import styles from './InstallmentsForm.module.scss';

const T_PATH = 'components.installments.InstallmentsForm';

interface IProps {
  handleFormCallback: () => void;
  installmentCandidates: ApartmentInstallmentCandidate[];
  installments: ApartmentInstallment[];
  reservationId: ApartmentReservation['id'];
  targetPrice?: number;
}

const InstallmentsForm = ({
  handleFormCallback,
  installmentCandidates,
  installments,
  reservationId,
  targetPrice,
}: IProps) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<ApartmentInstallment[]>([]); // Form data to be sent to the API
  const [inputFields, setInputFields] = useState<ApartmentInstallmentInputRow[]>([]); // Form input field values
  const [totalSum, setTotalSum] = useState(0);
  const [errorMessages, setErrorMessages] = useState<any[]>([]);
  const {
    isOpen: isAccordionOpen,
    buttonProps: accordionButtonProps,
    contentProps: accordionContentProps,
  } = useAccordion({ initiallyOpen: false });
  const [setApartmentInstallments, { isLoading: postInstallmentsLoading }] = useSetApartmentInstallmentsMutation();
  const accordionIcon = isAccordionOpen ? <IconAngleUp aria-hidden /> : <IconAngleDown aria-hidden />;

  const onFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!postInstallmentsLoading) {
      try {
        // Send form data to API
        await setApartmentInstallments({ formData, id: reservationId })
          .unwrap()
          .then(() => {
            // Clear any error messages
            setErrorMessages([]);
            // Show success toast
            toast.show({ type: 'success', content: t(`${T_PATH}.formSentSuccessfully`) });
            // Callback function for parent element after a successful request
            handleFormCallback();
          });
      } catch (err: any) {
        // Catch error data and display error messages from the API in an error toast
        const errorCode = err.originalStatus;
        const errorData = err.data;
        let errors = [];
        if (Array.isArray(errorData)) {
          errorData.forEach((row, index: number) => {
            Object.entries(row).forEach(([key, value]) => {
              const val = value as any;
              errors.push(`Row ${index + 1} - ${key}: ${val[0].message}`);
            });
          });
        } else {
          if (errorData.message) {
            errors.push(errorData.message);
          } else {
            errors.push(`${errorCode} - Error`);
          }
        }
        setErrorMessages(errors);
      }
    }
  };

  const getFormattedAmount = (amount: string) => {
    const replaced = amount.replaceAll(',', '.'); // convert all commas to dots
    try {
      const value = new Big(replaced);
      return value.mul(100).round().toNumber();
    } catch (e) {
      return amount;
    }
  };

  const formatDueDate = (dueDate: string) => moment(dueDate, 'YYYY-MM-DD').format('D.M.YYYY');

  // Combine a list of installments from candidates and saved installments
  // Use unionBy to remove duplicates by installment type
  const combinedPossibleInstallments = useCallback(() => {
    return unionBy(installmentCandidates, installments, 'type');
  }, [installmentCandidates, installments]);

  // Calculate total sum of all amount fields
  useEffect(() => {
    const sum = inputFields.reduce((previousValue, currentValue) => {
      const amount = getFormattedAmount(currentValue.amount);
      if (typeof amount !== 'number') {
        return previousValue;
      }
      return previousValue + amount;
    }, 0);
    setTotalSum(sum);
  }, [inputFields, setTotalSum]);

  // Render either saved installment data or installment candidates into inputFields
  useEffect(() => {
    const emptyInputRow: ApartmentInstallmentInputRow = {
      type: '',
      amount: '',
      due_date: '',
      account_number: '',
      reference_number: '',
      added_to_be_sent_to_sap_at: '',
    };

    // Create an array with a length of all possible installment rows (installments and candidates combined).
    // Initially fill all array items with emptyInputRow objects
    const initialInputRows = [...new Array(Object.keys(combinedPossibleInstallments()).length)].map(() => ({
      ...emptyInputRow,
    }));

    // Create a copy of initial input rows
    const installmentRows = [...initialInputRows];

    if (!!installments.length) {
      // Loop through saved installments and replace empty rows with installment data
      installments.forEach((installment, index: number) => {
        installmentRows[index].type = installment.type;
        installmentRows[index].amount = (installment.amount / 100).toFixed(2);
        installmentRows[index].account_number = installment.account_number;
        if (installment.due_date !== null) {
          // Always show Finnish locale values in the date input field
          installmentRows[index].due_date = formatDueDate(installment.due_date);
        }
        if (installment.reference_number) {
          installmentRows[index].reference_number = installment.reference_number;
        }
        if (installment.added_to_be_sent_to_sap_at) {
          installmentRows[index].added_to_be_sent_to_sap_at = formatDateTime(installment.added_to_be_sent_to_sap_at);
        }
      });
    } else {
      // If there was no installments, loop through installmentCandidates and replace empty rows with candidate data
      installmentCandidates.forEach((installmentCandidate, index: number) => {
        installmentRows[index].type = installmentCandidate.type;
        installmentRows[index].amount = (installmentCandidate.amount / 100).toFixed(2);
        installmentRows[index].account_number = installmentCandidate.account_number;
        if (installmentCandidate.due_date !== null) {
          // Always show Finnish locale values in the date input field
          installmentRows[index].due_date = formatDueDate(installmentCandidate.due_date);
        }
      });
    }

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
  }, [installments, installmentCandidates, combinedPossibleInstallments]);

  // Set data to be sent to the API
  useEffect(() => {
    // Create a copy of inputFields
    const inputs = [...inputFields];

    // Filter out empty rows.
    // Row is considered as filled if any of row.type, row.account_number or row.amount has a value
    const nonEmptyRows = inputs.filter((row) => row.type !== '' || row.account_number !== '' || row.amount !== '');

    // Map input field data to use correct format for the API
    const apiData = nonEmptyRows.map((row, index) => {
      // Use date format of YYYY-MM-DD if there's a valid date
      const formattedDate =
        moment(row.due_date, 'D.M.YYYY', true).isValid() && moment(row.due_date, 'D.M.YYYY', true).format('YYYY-MM-DD');
      // use either formatted due date, null for an empty value or row.due_date value if it was filled in and not a valid date
      const dueDate = formattedDate ? formattedDate : row.due_date === '' ? null : row.due_date;

      return {
        type: row.type,
        amount: getFormattedAmount(row.amount),
        due_date: dueDate,
        account_number: row.account_number,
      };
    }) as ApartmentInstallment[];

    // Set formatted apiData to formData
    setFormData(apiData);
  }, [inputFields]);

  const handleInputChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const inputs = [...inputFields];
    inputs[index][event.target.name as keyof ApartmentInstallmentInputRow] = event.target.value;
    setInputFields(inputs);
  };

  const handleSelectChange = (index: number, selectedOption: SelectOption) => {
    const inputs = [...inputFields];

    if (selectedOption.selectValue === '') {
      // Clear values from all input fields if the user selects the empty option from the dropdown
      Object.keys(inputs[index]).forEach((input) => {
        if (input !== 'reference_number') {
          // Clear all other input fields than reference number
          return (inputs[index][input as keyof ApartmentInstallmentInputRow] = '');
        }
      });
    } else {
      inputs[index][selectedOption.name as keyof ApartmentInstallmentInputRow] = selectedOption.selectValue;
    }

    setInputFields(inputs);
  };

  const InstallmentTypeOptions = (): SelectOption[] => {
    let options: SelectOption[] = [];

    // Loop through all available installment types and create dropdown options out of them
    Object.values(combinedPossibleInstallments()).forEach((installment) => {
      options.push({
        label: t(`ENUMS.InstallmentTypes.${installment.type}`),
        name: 'type',
        selectValue: installment.type,
      });
    });

    // Sort type options in the order of the InstallmentTypes ENUM list to stay consistent throughout the app
    const sortedOptions = () => {
      const InstallmentOrder = Object.values(InstallmentTypes);
      const optionsCopy = [...options];
      return optionsCopy.sort((a, b) =>
        a.selectValue
          ? b.selectValue
            ? InstallmentOrder.indexOf(a.selectValue as InstallmentTypes) -
              InstallmentOrder.indexOf(b.selectValue as InstallmentTypes)
            : -1
          : 1
      );
    };

    // Return options with an empty value as the first dropdown item
    return [{ label: '', name: 'type', selectValue: '' }, ...sortedOptions()];
  };

  const sumsMatch = (value: number, target: number) => {
    if (value === target) return true;
    return false;
  };

  // Define initial empty select option
  const emptySelectOption: SelectOption = {
    label: '',
    name: '',
    selectValue: '',
  };

  const renderSumMatchIcon = () => {
    if (targetPrice) {
      if (!sumsMatch(totalSum, targetPrice)) {
        return <IconAlertCircleFill color="var(--color-error)" />;
      }
      return <IconCheckCircleFill color="var(--color-tram)" />;
    }
  };

  const renderTableHeader = (isCandidateTableHeader: boolean) => (
    <thead>
      {isCandidateTableHeader ? (
        <tr className="hds-table__header-row">
          <th>{t(`${T_PATH}.installmentType`)}</th>
          <th>{t(`${T_PATH}.sum`)} &euro;</th>
          <th>{t(`${T_PATH}.dueDate`)}</th>
          <th>{t(`${T_PATH}.IbanAccountNumber`)}</th>
        </tr>
      ) : (
        <tr>
          <th style={{ width: '275px' }}>{t(`${T_PATH}.installmentType`)}</th>
          <th style={{ width: '140px' }}>{t(`${T_PATH}.sum`)} &euro;</th>
          <th style={{ width: '180px' }}>{t(`${T_PATH}.dueDate`)}</th>
          <th style={{ width: '220px' }}>{t(`${T_PATH}.IbanAccountNumber`)}</th>
          <th className={styles.moreHorizontalPadding}>{t(`${T_PATH}.referenceNumber`)}</th>
          <th>{t(`${T_PATH}.sentToSAP`)}</th>
        </tr>
      )}
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
              disabled={!!input.added_to_be_sent_to_sap_at}
            />
          </td>
          <td>
            <TextInput
              id={`amount-${index}`}
              name="amount"
              label=""
              type="number"
              pattern="[0-9]+([\.,][0-9]+)?"
              className={styles.input}
              value={input.amount}
              onChange={(event) => handleInputChange(index, event)}
              data-testid="amount"
              disabled={!!input.added_to_be_sent_to_sap_at}
            />
          </td>
          <td>
            <TextInput
              id={`dueDate-${index}`}
              name="due_date"
              placeholder={t('d.m.yyyy')}
              label=""
              className={styles.input}
              value={input.due_date}
              onChange={(event) => handleInputChange(index, event)}
              autoComplete="off"
              disabled={!!input.added_to_be_sent_to_sap_at}
            />
          </td>
          <td>
            <TextInput
              id={`accountNumber-${index}`}
              name="account_number"
              label=""
              className={styles.input}
              value={input.account_number}
              onChange={(event) => handleInputChange(index, event)}
              autoComplete="off"
              disabled={!!input.added_to_be_sent_to_sap_at}
            />
          </td>
          <td className={styles.moreHorizontalPadding}>
            <TextInput
              id={`referenceNumber-${index}`}
              name="reference_number"
              label=""
              className={styles.input}
              value={input.reference_number}
              readOnly
            />
          </td>
          <td>
            <TextInput
              id={`sentToSAP-${index}`}
              name="added_to_be_sent_to_sap_at"
              label=""
              className={styles.input}
              value={input.added_to_be_sent_to_sap_at || '-'}
              readOnly
            />
          </td>
        </tr>
      ))}
    </tbody>
  );

  const renderTableFooter = () => (
    <tfoot className="hds-table__content">
      <tr>
        <th style={{ textAlign: 'right' }}>{t(`${T_PATH}.total`)}</th>
        <td colSpan={5}>
          <span className={styles.totalWithIcon}>
            <strong className={cx(targetPrice && !sumsMatch(totalSum, targetPrice) && styles.errorInSum)}>
              {formattedSalesPrice(totalSum)}
            </strong>{' '}
            {renderSumMatchIcon()}
          </span>
          <span className={styles.targetPrice}>
            {t(`${T_PATH}.salesPrice`)} <strong>{targetPrice ? formattedSalesPrice(targetPrice) : '-'}</strong>
          </span>
        </td>
      </tr>
    </tfoot>
  );

  const renderInstallmentCandidates = () => (
    <table className={cx(styles.installmentCandidatesTable, 'hds-table hds-table--dark hds-table--zebra')}>
      {renderTableHeader(true)}
      <tbody className="hds-table__content">
        {installmentCandidates.map((candidate, index) => (
          <tr key={index}>
            <td>{t(`ENUMS.InstallmentTypes.${candidate.type}`)}</td>
            <td>{(candidate.amount / 100).toFixed(2)}</td>
            <td>{candidate.due_date !== null ? formatDueDate(candidate.due_date) : '-'}</td>
            <td>{candidate.account_number}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <>
      <div className={styles.installmentCandidatesWrapper}>
        <Button
          size="small"
          variant="secondary"
          theme="black"
          iconLeft={accordionIcon}
          className={styles.toggleButton}
          {...accordionButtonProps}
        >
          {isAccordionOpen ? t(`${T_PATH}.hideInstallmentCandidates`) : t(`${T_PATH}.showInstallmentCandidates`)}
        </Button>
        <div {...accordionContentProps}>
          <Card border>
            <h2 className={styles.accordionTitle}>{t(`${T_PATH}.installmentCandidateTableText`)}</h2>
            {renderInstallmentCandidates()}
          </Card>
        </div>
      </div>
      {!!errorMessages.length && (
        <div className={styles.errorWrapper}>
          <Notification type="error" style={{ margin: '15px 0' }} label={t(`${T_PATH}.formError`)}>
            <ul>
              {errorMessages.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Notification>
        </div>
      )}
      <form
        id={`apartmentInstallmentForm-${reservationId}`}
        className={styles.formWrapper}
        onSubmit={(e) => onFormSubmit(e)}
      >
        <table className={cx(styles.installmentsTable, 'hds-table hds-table--light')}>
          {renderTableHeader(false)}
          {renderTableContent()}
          {renderTableFooter()}
        </table>
      </form>
    </>
  );
};

export default InstallmentsForm;
