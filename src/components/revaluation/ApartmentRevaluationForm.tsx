import { yupResolver } from '@hookform/resolvers/yup';
import { Button, DateInput, Dialog, TextInput } from 'hds-react';
import moment from 'moment';
import React from 'react';
import { get, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

import { ApartmentReservationCustomer, ApartmentRevaluation, CostIndex } from '../../types';
import formattedCurrency from '../../utils/formatCurrency';
import { getCurrentLangCode } from '../../utils/getCurrentLangCode';
import '../costindex/CostIndexSingleTable.module.scss';
import { toast } from '../common/toast/ToastManager';

import styles from './ApartmentRevaluationModal.module.scss';

const T_PATH = 'components.revaluation.ApartmentRevaluationForm';

type NewDefaults = {
  startDateISODefault: string | null;
  rightOfOccupancyPayment: string;
};

interface Props {
  revaluation?: ApartmentRevaluation;
  newDefaults?: NewDefaults;
  reservationId: number;
  costIndexes: CostIndex[];
  customer: ApartmentReservationCustomer;
  closeDialog: () => void;
  handleFormCallback: (arg0: ApartmentRevaluation) => void;
  isLoading: boolean;
  editing: boolean;
}

function stringDecimalToNumber(decimal: string) {
  return parseFloat(decimal.replace(',', '.'));
}

function numberFlooredToTwoDecimals(value: number) {
  return Math.floor(value * 100) / 100;
}

function determineAdjustedCost(
  originalRightOfOccupancyPayment: string,
  startIndex: string,
  endIndex: string,
  alterationWork: string | undefined = undefined
) {
  const adjustedCost =
    (stringDecimalToNumber(originalRightOfOccupancyPayment) / stringDecimalToNumber(startIndex)) *
      stringDecimalToNumber(endIndex) +
    (alterationWork ? stringDecimalToNumber(alterationWork) : 0);
  return numberFlooredToTwoDecimals(adjustedCost);
}

function getDefaults(revaluation?: ApartmentRevaluation, newDefaults?: NewDefaults) {
  if (revaluation) {
    return {
      start_right_of_occupancy_payment: revaluation.start_right_of_occupancy_payment.replace('.', ','),
      start_date: moment(revaluation.start_date, 'YYYY-M-D').format('D.M.YYYY'),
      end_date: moment(revaluation.end_date, 'YYYY-M-D').format('D.M.YYYY'),
      alteration_work: revaluation.alteration_work.replace('.', ','),
    };
  } else if (newDefaults) {
    const { startDateISODefault, rightOfOccupancyPayment } = newDefaults;
    const startDateDefault = moment(startDateISODefault, 'YYYY-M-D');
    return {
      start_right_of_occupancy_payment: rightOfOccupancyPayment.replace('.', ','),
      start_date: startDateDefault.isValid() ? startDateDefault.format('D.M.YYYY') : '',
      end_date: moment().format('D.M.YYYY'),
    };
  }
  return {};
}

const ApartmentRevaluationForm = ({
  revaluation,
  newDefaults,
  reservationId,
  costIndexes,
  customer,
  closeDialog,
  handleFormCallback,
  isLoading,
  editing,
}: Props): JSX.Element => {
  const { t: translate } = useTranslation();
  const t = (label: string) => translate(`${T_PATH}.${label}`);

  const defaultValues = getDefaults(revaluation, newDefaults);
  const schema = yup.object({
    start_date: yup.string().required(t('startDateRequired')),
    end_date: yup.string().required(t('endDateRequired')),
    alteration_work: yup.string(),
  });

  const {
    handleSubmit,
    register,
    setValue,
    formState: { errors },
    watch,
  } = useForm<ApartmentRevaluation>({
    resolver: yupResolver(schema),
    defaultValues: defaultValues,
  });

  const { onChange: _startDateOnChange, ...startDateProps } = register('start_date');
  const { onChange: _endDateOnChange, ...endDateProps } = register('end_date');

  const originalRightOfOccupancyPaymentRaw = watch('start_right_of_occupancy_payment');
  const startDateRaw = watch('start_date');
  const endDateRaw = watch('end_date');
  const alterationWork = watch('alteration_work');

  const startDate = moment(startDateRaw, 'D.M.YYYY', true);
  const endDate = moment(endDateRaw, 'D.M.YYYY', true);

  // Note: cost indexes are sorted from newest to oldest by default
  const startCostIndex = startDate.isValid()
    ? costIndexes.find((costIndex) => moment(costIndex.valid_from, 'YYYY-M-D', true) <= startDate)
    : null;
  const endCostIndex = endDate.isValid()
    ? costIndexes.find((costIndex) => moment(costIndex.valid_from, 'YYYY-M-D', true) <= endDate)
    : null;

  let adjustedRightOfOccupancyPayment: number | null = null;
  if (originalRightOfOccupancyPaymentRaw && startCostIndex && endCostIndex) {
    adjustedRightOfOccupancyPayment = determineAdjustedCost(
      originalRightOfOccupancyPaymentRaw,
      startCostIndex.value,
      endCostIndex.value
    );
  }
  const adjustedRightOfOccupancyPaymentFormatted = adjustedRightOfOccupancyPayment
    ? formattedCurrency(adjustedRightOfOccupancyPayment)
    : '-';

  let totalPayment: number | null = null;
  if (originalRightOfOccupancyPaymentRaw && startCostIndex && endCostIndex) {
    totalPayment = determineAdjustedCost(
      originalRightOfOccupancyPaymentRaw,
      startCostIndex.value,
      endCostIndex.value,
      alterationWork
    );
  }
  const totalPaymentFormatted = totalPayment ? formattedCurrency(totalPayment) : '-';

  const onSubmit = (formData: {
    start_right_of_occupancy_payment: string;
    start_date: string;
    end_date: string;
    alteration_work: string;
  }) => {
    if (!startCostIndex || !endCostIndex || !adjustedRightOfOccupancyPayment) {
      toast.show({ type: 'error', content: t('costIndexError') });
      return;
    }
    const requestData = {
      apartment_reservation: reservationId,
      start_right_of_occupancy_payment: formData.start_right_of_occupancy_payment.replace(',', '.'),
      start_date: moment(formData.start_date, 'D.M.YYYY').format('YYYY-M-D'),
      end_date: moment(formData.end_date, 'D.M.YYYY').format('YYYY-M-D'),
      alteration_work: formData.alteration_work ? formData.alteration_work.replace(',', '.') : '0',
      start_cost_index_value: startCostIndex.value,
      end_cost_index_value: endCostIndex.value,
      end_right_of_occupancy_payment: adjustedRightOfOccupancyPayment.toFixed(2),
    };
    handleFormCallback(requestData);
  };

  const formId = `apartment-revaluation-form-for-reservation-${reservationId}`;

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)}>
      <Dialog.Content>
        <div className={styles.revaluationFormBlock}>
          {t('forCustomer')}:
          <div className={styles.applicants}>
            {customer.primary_profile.last_name} {customer.primary_profile.first_name}
            {customer.secondary_profile &&
              ` (${customer.secondary_profile.last_name}, ${customer.secondary_profile.first_name})`}
          </div>
        </div>
        <TextInput
          id="originalRightOfOccupancyPayment"
          label={t('originalRightOfOccupancyPayment')}
          placeholder="0"
          errorText={get(errors, 'start_right_of_occupancy_payment')?.message}
          invalid={Boolean(errors.start_right_of_occupancy_payment)}
          pattern="[0-9]+([\.,][0-9]+)?"
          disabled={!editing}
          {...register('start_right_of_occupancy_payment')}
          className={styles.revaluationFormBlock}
        />
        <div className={styles.revaluationFormBlock}>
          <DateInput
            id="start_date"
            label={t('costIndexStartDate')}
            invalid={
              Boolean(get(errors, 'start_date')) ||
              (!!startDateRaw && !moment(startDateRaw, 'D.M.YYYY', true).isValid())
            }
            language={getCurrentLangCode()}
            errorText={get(errors, 'start_date')?.message}
            onChange={(value) => setValue('start_date', value)}
            minDate={new Date(1990, 1, 1)}
            defaultValue={defaultValues.start_date}
            disabled={!editing}
            {...startDateProps}
          />
          <div>
            {t('costIndexValueForStartDate')}: {startCostIndex ? startCostIndex.value.replace('.', ',') : '-'}
          </div>
        </div>
        <TextInput
          id="alterationWork"
          label={t('alterationWork')}
          placeholder="0"
          errorText={get(errors, 'alteration_work')?.message}
          invalid={Boolean(errors.alteration_work)}
          disabled={!editing}
          {...register('alteration_work')}
          className={styles.revaluationFormBlock}
        />
        <div className={styles.revaluationFormBlock}>
          <DateInput
            id="end_date"
            label={t('costIndexEndDate')}
            invalid={
              Boolean(get(errors, 'end_date')) || (!!endDateRaw && !moment(endDateRaw, 'D.M.YYYY', true).isValid())
            }
            language={getCurrentLangCode()}
            errorText={get(errors, 'end_date')?.message}
            onChange={(value) => setValue('end_date', value)}
            defaultValue={defaultValues.end_date}
            disabled={!editing}
            {...endDateProps}
          />
          <div>
            {t('costIndexValueForEndDate')}: {endCostIndex ? endCostIndex.value.replace('.', ',') : '-'}
          </div>
        </div>
        <div className={styles.revaluationFormBlock}>
          <b>{t('adjustedRightOfOccupancyPayment')}</b>: {adjustedRightOfOccupancyPaymentFormatted}
        </div>
        <div className={styles.revaluationFormBlock}>
          <b>{t('totalPayment')}</b>: {totalPaymentFormatted}
        </div>
      </Dialog.Content>
      <Dialog.ActionButtons>
        <Button variant="primary" type="submit" form={formId} disabled={isLoading || !editing}>
          {t('submit')}
        </Button>
        <Button variant="secondary" onClick={() => closeDialog()}>
          {editing ? t('cancel') : t('close')}
        </Button>
      </Dialog.ActionButtons>
    </form>
  );
};

export default ApartmentRevaluationForm;
