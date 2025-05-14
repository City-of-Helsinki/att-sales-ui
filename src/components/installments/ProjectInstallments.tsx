import Big from 'big.js';
import cx from 'classnames';
import { Button, ButtonVariant, Dialog, Notification, NotificationSize, Select, TextInput, Option } from 'hds-react';
import _ from 'lodash';
import moment from 'moment';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  HasoInstallmentPercentageSpecifiers,
  HitasInstallmentPercentageSpecifiers,
  InstallmentTypes,
} from '../../enums';
import {
  useGetProjectByIdQuery,
  useGetProjectInstallmentsQuery,
  useSendApartmentInstallmentsToSAPMutation,
  useSetProjectInstallmentsMutation,
} from '../../redux/services/api';
import { Apartment, Project, ProjectInstallment, ProjectInstallmentInputRow } from '../../types';
import parseApiErrors from '../../utils/parseApiErrors';
import StatusText from '../common/statusText/StatusText';
import { toast } from '../common/toast/ToastManager';

import InstallmentsLoader from './InstallmentsLoader';
import styles from './ProjectInstallments.module.scss';
import ReservationsLoader from './ReservationsLoader';
import { click } from '@testing-library/user-event/dist/click';

const T_PATH = 'components.installments.ProjectInstallments';

interface IProps {
  apartments: Apartment[] | undefined;
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
  apartments = [],
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
  const [sendApartmentInstallmentsToSAP, { isLoading: isSendingToSAP }] = useSendApartmentInstallmentsToSAPMutation();
  const [formData, setFormData] = useState<ProjectInstallment[]>([]); // Form data to be sent to the API
  const [inputFields, setInputFields] = useState<ProjectInstallmentInputRow[]>([]); // Form input field values
  const [installmentsData, setInstallmentsData] = useState<Record<number, any[]>>({});
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [reservationIds, setReservationIds] = useState<string[]>([]);

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

  const [allReservations, setAllReservations] = useState<Record<string, any[]>>({});

  const handleReservationsLoaded = (apartmentUuid: string, reservations: any[]) => {
    setAllReservations((prev) => ({
      ...prev,
      [apartmentUuid]: reservations,
    }));
  };

  const { data: project } = useGetProjectByIdQuery(uuid);

  const handleInstallmentsLoaded = (reservationId: number, installments: any[]) => {
    setInstallmentsData((prev) => ({ ...prev, [reservationId]: installments }));
  };

  const [filteredReservations, setFilteredReservations] = useState<string[]>([]);

  const isLotteryCompleted = useMemo(() => Boolean(project?.lottery_completed_at), [project]);

  const isAllReservationsLoaded = useMemo(() => {
    return isLotteryCompleted && Object.keys(allReservations).length > 0;
  }, [allReservations, isLotteryCompleted]);

  // Update `reservationIds`, when all `reservations` are loaded
  useEffect(() => {
    if (!isAllReservationsLoaded) {
      return;
    }

    const newReservationIds = Object.values(allReservations)
      .flat()
      .filter((reservation) => reservation.id) // use only reservations with `id`
      .map((reservation) => String(reservation.id));

    if (!_.isEqual(newReservationIds, reservationIds)) {
      setReservationIds(newReservationIds);
    }
  }, [reservationIds, isAllReservationsLoaded, allReservations]); // ✅ `reservationIds` update first

  // filtered after load
  useEffect(() => {
    if (!isAllReservationsLoaded || !reservationIds.length || !isLotteryCompleted) {
      return;
    }

    const reservationMap = new Map<number, any>();
    for (const list of Object.values(allReservations)) {
      for (const res of list) {
        reservationMap.set(res.id, res);
      }
    }

    const newFilteredReservations = reservationIds.filter((reservationId) => {
      const numericId = Number(reservationId);
      const reservation = reservationMap.get(numericId);
      const hasInstallments = installmentsData[numericId]?.length > 0;
      const isSold = reservation?.state === 'sold';
      return hasInstallments && isSold;
    });

    if (!_.isEqual(newFilteredReservations, filteredReservations)) {
      setFilteredReservations(newFilteredReservations);
    }
  }, [
    filteredReservations,
    reservationIds,
    installmentsData,
    isAllReservationsLoaded,
    isLotteryCompleted,
    allReservations,
  ]);

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

  const handleSelectChange = (index: number, selectedOption: Option, field: string) => {
    const inputs = [...inputFields];
    inputs[index][field as keyof ProjectInstallmentInputRow] = selectedOption.value;
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
    let options: Option[] = [
      {
        label: '',
        value: '',
        disabled: false,
        selected: false,
        isGroupLabel: false,
        visible: true,
      },
    ];
    // Loop through InstallmentTypes ENUMs and create dropdown options out of them
    Object.values(InstallmentTypes).forEach((type) => {
      options.push({
        label: t(`ENUMS.InstallmentTypes.${type}`),
        value: type,
        disabled: false,
        selected: false,
        isGroupLabel: false,
        visible: true,
      });
    });
    return options;
  };

  const InstallmentUnitOptions: Option[] = [
    {
      label: '€',
      value: unitOptions.UNIT_AS_EURO,
      disabled: false,
      selected: false,
      isGroupLabel: false,
      visible: true,
    },
    {
      label: t(`${T_PATH}.fromPrice`),
      value: unitOptions.UNIT_AS_PERCENTAGE,
      disabled: false,
      selected: false,
      isGroupLabel: false,
      visible: true,
    },
  ];

  const InstallmentPercentageSpecifierOptions = () => {
    let options: Option[] = [];
    // Loop through either Hitas or Haso InstallmentPercentageSpecifiers ENUM based on project ownership type,
    // and create dropdown options out of them
    if (ownershipType === 'haso') {
      Object.values(HasoInstallmentPercentageSpecifiers).forEach((type) => {
        options.push({
          label: t(`ENUMS.HasoInstallmentPercentageSpecifiers.${type}`),
          value: type,
          disabled: false,
          selected: false,
          isGroupLabel: false,
          visible: true,
        });
      });
    } else {
      Object.values(HitasInstallmentPercentageSpecifiers).forEach((type) => {
        options.push({
          label: t(`ENUMS.HitasInstallmentPercentageSpecifiers.${type}`),

          value: type,
          disabled: false,
          selected: false,
          isGroupLabel: false,
          visible: true,
        });
      });
    }
    return options;
  };

  // Define initial empty select option
  const emptySelectOption: Option = {
    label: '',
    value: '',
    disabled: false,
    selected: false,
    isGroupLabel: false,
    visible: true,
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
              className={styles.select}
              options={InstallmentTypeOptions()}
              value={
                InstallmentTypeOptions().find((value) => value.value === input.type)?.value || emptySelectOption.value
              }
              onChange={(value: Option[], clickedOption: Option) => handleSelectChange(index, clickedOption, 'type')}
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
              className={styles.select}
              options={InstallmentUnitOptions}
              value={
                isFlexibleInstallmentRow(index)
                  ? emptySelectOption.value
                  : InstallmentUnitOptions.find((value) => value.value === input.unit)?.value || emptySelectOption.value
              }
              onChange={(value: Option[], clickedOption: Option) => handleSelectChange(index, clickedOption, 'unit')}
              disabled={isFlexibleInstallmentRow(index)}
            />
          </td>
          <td>
            <Select
              id={`unitSpecifier-${index}`}
              placeholder={isPercentageRow(index) ? t(`${T_PATH}.select`) : ''}
              className={styles.select}
              options={InstallmentPercentageSpecifierOptions()}
              value={
                isPercentageRow(index)
                  ? InstallmentPercentageSpecifierOptions().find((value) => value.value === input.percentage_specifier)
                      ?.value || emptySelectOption.value
                  : emptySelectOption.value
              }
              onChange={(value: Option[], clickedOption: Option) =>
                handleSelectChange(index, clickedOption, 'percentage_specifier')
              }
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
      <Notification type="error" size={NotificationSize.Small} style={{ marginTop: 15 }}>
        {t(`${T_PATH}.errorLoadingInstallments`)}
      </Notification>
    );
  }

  const isEra6Or7Filled = () => {
    if (
      !inputFields.some(
        (row, index) =>
          (index === 5 || index === 6) &&
          row.due_date.trim() !== '' &&
          row.account_number.trim() !== '' &&
          row.sum.trim() !== '' &&
          row.type.trim() !== ''
      )
    ) {
      return false;
    }

    return reservationIds.length > 0;
  };

  const handleConfirmSend = async () => {
    setIsConfirmDialogOpen(false);
    const numericIds = filteredReservations.map(Number);

    const selectedTypes: string[] = [];
    if (inputFields[5]?.due_date?.trim() !== '') selectedTypes.push('PAYMENT_6');
    if (inputFields[6]?.due_date?.trim() !== '') selectedTypes.push('PAYMENT_7');

    try {
      await Promise.all(numericIds.map((id) => sendApartmentInstallmentsToSAP({ types: selectedTypes, id }).unwrap()));
      toast.show({ type: 'success', content: t('installments.sentSuccessfully') });
    } catch (err) {
      toast.show({ type: 'error', content: t('installments.sendError') });
    }
  };

  return (
    <>
      {apartments.length > 0 &&
        apartments.map((apartment, index) => (
          <ReservationsLoader
            key={apartment.apartment_uuid}
            apartmentUuid={apartment.apartment_uuid}
            allReservations={allReservations}
            onReservationsLoaded={handleReservationsLoaded}
            delayMs={index * 100}
          />
        ))}
      {reservationIds.map((reservationId, index) => (
        <InstallmentsLoader
          key={reservationId}
          reservationId={Number(reservationId)}
          onInstallmentsLoaded={handleInstallmentsLoaded}
          allInstallments={installmentsData}
          delayMs={index * 100}
        />
      ))}
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
                variant={ButtonVariant.Primary}
                // isLoading={postInstallmentsLoading}
                // loadingText={t(`${T_PATH}.save`)}
              >
                {t(`${T_PATH}.save`)}
              </Button>
              {isEra6Or7Filled() && filteredReservations.length > 0 && (
                <>
                  <Button
                    type="button"
                    variant={ButtonVariant.Secondary}
                    style={{ marginLeft: '10px' }}
                    onClick={() => setIsConfirmDialogOpen(true)}
                    // isLoading={isSendingToSAP}
                  >
                    {t(`${T_PATH}.SAP`)}
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </form>
      <Dialog
        id="confirm-send-dialog"
        aria-labelledby="confirm-send-dialog-title"
        isOpen={isConfirmDialogOpen}
        close={() => setIsConfirmDialogOpen(false)}
        closeButtonLabelText={t(`${T_PATH}.closeDialog`) || ''}
      >
        <Dialog.Header id="confirm-send-dialog-title" title={t(`${T_PATH}.sendToSAP`)} />
        <Dialog.Content>
          <p>{t(`${T_PATH}.sendToSAPMessage`)}</p>
        </Dialog.Content>
        <Dialog.ActionButtons>
          <Button onClick={handleConfirmSend} disabled={isSendingToSAP}>
            {t(`${T_PATH}.sendToSAPButtonYes`)}
          </Button>
          <Button onClick={() => setIsConfirmDialogOpen(false)} variant={ButtonVariant.Secondary}>
            {t(`${T_PATH}.sendToSAPButtonNo`)}
          </Button>
        </Dialog.ActionButtons>
      </Dialog>
    </>
  );
};

export default ProjectInstallments;
