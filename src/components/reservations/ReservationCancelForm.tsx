import React from 'react';
import { Controller, useForm, SubmitHandler, get } from 'react-hook-form';
import { omit } from 'lodash';
import { Select, TextArea } from 'hds-react';
import { useTranslation } from 'react-i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import SelectCustomerDropdown from '../customers/SelectCustomerDropdown';
import { Project, ReservationCancelFormData, SelectOption } from '../../types';
import { ReservationCancelReasons } from '../../enums';

const T_PATH = 'components.reservations.ReservationCancelForm';

interface IProps {
  formId: string;
  handleFormCallback: (data: ReservationCancelFormData) => void;
  ownershipType: Project['ownership_type'];
}

const ReservationCancelForm = ({ formId, ownershipType, handleFormCallback }: IProps): JSX.Element => {
  const { t } = useTranslation();
  const schema = yup.object({
    cancellation_reason: yup.string().required(t(`${T_PATH}.reasonRequired`)),
    comment: yup.string().nullable(),
    new_customer_id: yup
      .string()
      .when('cancellation_reason', {
        is: ReservationCancelReasons.TRANSFERRED,
        then: yup.string().required(t(`${T_PATH}.customerRequired`)),
      })
      .nullable(),
  });
  const {
    control,
    handleSubmit,
    register,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReservationCancelFormData>({
    resolver: yupResolver(schema),
  });

  const isTransferred = watch('cancellation_reason') === ReservationCancelReasons.TRANSFERRED ? true : false;

  const onSubmit: SubmitHandler<ReservationCancelFormData> = (data, event) => {
    event?.preventDefault();
    const formData = { ...data };

    // If cancellation reason is not "transferred", remove "new_customer_id" field from api data
    const apiData = !isTransferred ? omit(formData, 'new_customer_id') : formData;

    handleFormCallback(apiData);
  };

  const reasonOptions = (): SelectOption[] => {
    const options: SelectOption[] = [];

    Object.entries(ReservationCancelReasons).forEach((reason) => {
      const enumName = reason[0];
      const enumValue = reason[1];

      // Remove unselectable reservation cancel reasons from a dropdown
      if (
        enumValue === ReservationCancelReasons.OTHER_APARTMENT_OFFERED ||
        enumValue === ReservationCancelReasons.LOWER_PRIORITY ||
        enumValue === ReservationCancelReasons.OFFER_REJECTED
      ) {
        return null;
      }

      // Remove "transferred" option from Hitas and Puolihitas apartments
      if (enumValue === ReservationCancelReasons.TRANSFERRED && ownershipType.toLowerCase() !== 'haso') {
        return null;
      }

      return options.push({
        label: t(`ENUMS.ReservationCancelReasons.${enumName}`),
        name: 'cancellation_reason',
        selectValue: enumValue,
      });
    });

    return options;
  };

  const getReasonOption = (value: string) => {
    if (value === '') return null;
    return reasonOptions().find((option) => option.selectValue === value);
  };

  const handleSelectCallback = (customerId: string) => {
    setValue('new_customer_id', customerId);
  };

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="cancellation_reason"
        control={control}
        render={({ field }) => (
          <Select
            id="cancellation_reason"
            label={t(`${T_PATH}.reason`)}
            placeholder={t(`${T_PATH}.reason`)}
            required
            isOptionDisabled={(item: SelectOption): boolean => !!item.disabled}
            invalid={Boolean(get(errors, 'cancellation_reason'))}
            error={get(errors, 'cancellation_reason')?.message}
            options={reasonOptions()}
            value={getReasonOption(field.value || '')}
            onChange={(selected: SelectOption) => {
              setValue('cancellation_reason', selected.selectValue);
            }}
            style={{ marginBottom: '1rem' }}
          />
        )}
      />
      {isTransferred && (
        <div style={{ marginBottom: '1rem' }}>
          <SelectCustomerDropdown
            handleSelectCallback={handleSelectCallback}
            errorMessage={get(errors, 'new_customer_id')?.message}
            hasError={Boolean(get(errors, 'new_customer_id'))}
            helpText={t(`${T_PATH}.transferToCustomerHelpText`)}
          />
          <input {...register('new_customer_id')} readOnly hidden />
        </div>
      )}
      <TextArea
        id="additionalInfo"
        label={t(`${T_PATH}.additionalInfo`)}
        invalid={Boolean(errors.comment)}
        errorText={errors.comment?.message}
        autoComplete="off"
        {...register('comment')}
      />
    </form>
  );
};

export default ReservationCancelForm;
