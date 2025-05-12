import React, { useEffect } from 'react';
import { Controller, useForm, SubmitHandler, get } from 'react-hook-form';
import { Select, TextArea, Option } from 'hds-react';
import { useTranslation } from 'react-i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { ApartmentReservationWithCustomer, ReservationEditFormData } from '../../types';
import { ApartmentReservationStates } from '../../enums';

const T_PATH = 'components.reservations.ReservationEditForm';

interface IProps {
  formId: string;
  reservation: ApartmentReservationWithCustomer;
  handleFormCallback: (data: ReservationEditFormData) => void;
}

const ReservationEditForm = ({ formId, reservation, handleFormCallback }: IProps): JSX.Element => {
  const { t } = useTranslation();
  const schema = yup.object({
    state: yup.string().required(t(`${T_PATH}.stateRequired`)),
    comment: yup.string().nullable(),
  });
  const {
    control,
    handleSubmit,
    register,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ReservationEditFormData>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (reservation) {
      // Use reservation state as initial form state
      reset({ state: reservation.state, comment: '' });
    }
  }, [reservation, reset]);

  const onSubmit: SubmitHandler<ReservationEditFormData> = (data, event) => {
    event?.preventDefault();
    handleFormCallback(data);
  };

  const stateOptions = (): Option[] => {
    const options: Option[] = [];

    Object.entries(ApartmentReservationStates).forEach((state) => {
      const enumName = state[0];
      const enumValue = state[1];

      // Don't add "submitted" and "canceled" state to the dropdown options
      if (enumValue === ApartmentReservationStates.CANCELED || enumValue === ApartmentReservationStates.SUBMITTED) {
        return null;
      }

      return options.push({
        label: t(`ENUMS.ApartmentReservationStates.${enumName}`),
        // name: 'state',
        value: enumValue,
        disabled: enumValue.indexOf('offer') !== -1, // disable options that contains "offer"
        selected: false,
        isGroupLabel: false,
        visible: true,
      });
    });

    return options;
  };

  const getStateOption = (value: string) => {
    if (value === '') return undefined;
    return stateOptions().filter((option) => option.value === value);
  };

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="state"
        control={control}
        render={({ field }) => (
          <Select
            id="state"
            // label={t(`${T_PATH}.state`)}
            placeholder={t(`${T_PATH}.state`)}
            required
            // isOptionDisabled={(item: Option): boolean => !!item.disabled}
            invalid={Boolean(get(errors, 'state'))}
            // error={get(errors, 'state')?.message}
            options={stateOptions()}
            value={getStateOption(field.value || '')}
            onChange={(selected: Option[], clickedOption: Option) => {
              setValue('state', clickedOption.value as ApartmentReservationStates);
            }}
            style={{ marginBottom: '1rem' }}
          />
        )}
      />
      <TextArea
        id="additionalInfo"
        label={t(`${T_PATH}.additionalInfo`)}
        invalid={Boolean(errors.comment)}
        errorText={errors.comment?.message}
        autoComplete="off"
        maxLength={255}
        {...register('comment')}
      />
    </form>
  );
};

export default ReservationEditForm;
