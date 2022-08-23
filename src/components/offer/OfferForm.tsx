import React, { useEffect } from 'react';
import cx from 'classnames';
import moment from 'moment';
import { Controller, useForm, SubmitHandler, get } from 'react-hook-form';
import { DateInput, RadioButton, SelectionGroup, TextArea } from 'hds-react';
import { useTranslation } from 'react-i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import formatDateTime from '../../utils/formatDateTime';
import OfferEmailMessage from './OfferEmailMessage';
import { Offer, OfferFormData, Project } from '../../types';
import { OfferState } from '../../enums';
import { getCurrentLangCode } from '../../utils/getCurrentLangCode';

import styles from './OfferForm.module.scss';

const T_PATH = 'components.offer.OfferForm';

interface IProps {
  formId: string;
  handleFormCallback: (data: OfferFormData) => void;
  offer?: Offer;
  ownershipType: Project['ownership_type'];
  reservationId: Offer['apartment_reservation_id'];
}

const OfferForm = ({ formId, handleFormCallback, offer, ownershipType, reservationId }: IProps) => {
  const { t } = useTranslation();

  const offerStateSchema = !!offer
    ? {
        state: yup
          .mixed<OfferState>()
          .oneOf(Object.values(OfferState))
          .required(t(`${T_PATH}.required`)),
      }
    : undefined;
  const schema = yup.object({
    apartment_reservation_id: yup.number().required(t(`${T_PATH}.required`)),
    valid_until: yup.string().required(t(`${T_PATH}.required`)),
    comment: yup.string().nullable(),
    ...offerStateSchema,
  });

  const {
    control,
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OfferFormData>({
    resolver: yupResolver(schema),
  });

  const isRejectSelected = watch('state') === OfferState.REJECTED;

  const validUntilDate = watch('valid_until');

  useEffect(() => {
    if (offer) {
      // Use saved offer as initial form state
      reset({
        apartment_reservation_id: reservationId,
        comment: offer.comment,
        state: offer.state,
        valid_until: moment(offer.valid_until, 'YYYY-MM-DD').format('D.M.YYYY'),
      });
    } else {
      // For new offers, set initial valid_until date two weeks from this day
      const twoWeeksFromThisDay = moment().add(2, 'weeks').format('D.M.YYYY');

      reset({
        apartment_reservation_id: reservationId,
        comment: '',
        valid_until: twoWeeksFromThisDay,
      });
    }
  }, [offer, reset, reservationId]);

  const getRadioLabel = (state: OfferState) => {
    const createdAtTime = offer?.created_at ? `- ${formatDateTime(offer.created_at)}` : '';
    const concludedTime = offer?.concluded_at ? `- ${formatDateTime(offer.concluded_at)}` : '';
    const sentText = t(`${T_PATH}.offerSent`);
    const acceptedText = t(`ENUMS.OfferState.ACCEPTED`);
    const rejectedText = t(`ENUMS.OfferState.REJECTED`);

    switch (state) {
      case OfferState.PENDING:
        return `${sentText} ${createdAtTime ?? createdAtTime}`;
      case OfferState.ACCEPTED:
        if (offer?.state === OfferState.ACCEPTED) {
          return `${acceptedText} ${concludedTime}`;
        }
        return acceptedText;
      case OfferState.REJECTED:
        if (offer?.state === OfferState.REJECTED) {
          return `${rejectedText} ${concludedTime}`;
        }
        return rejectedText;
    }
  };

  const onSubmit: SubmitHandler<OfferFormData> = (data, event) => {
    event?.preventDefault();
    const apiData = { ...data };

    // Use valid until date format of YYYY-MM-DD if there's a valid date
    const formattedDate =
      moment(apiData.valid_until, 'D.M.YYYY', true).isValid() &&
      moment(apiData.valid_until, 'D.M.YYYY', true).format('YYYY-MM-DD');

    apiData.valid_until = formattedDate ? formattedDate : apiData.valid_until;

    // If it's a new offer, set offer state as pending
    if (!offer) {
      apiData.state = OfferState.PENDING;
    }

    handleFormCallback(apiData);
  };

  return (
    <div className={styles.offerGrid}>
      <div className={cx(styles.textareaColumn, styles.fullHeightColumn)}>
        <div className={styles.inputWrapper}>
          <OfferEmailMessage reservationId={reservationId} validUntil={validUntilDate} />
        </div>
      </div>
      <div className={styles.textareaColumn}>
        <form id={formId} className={styles.offerForm} onSubmit={handleSubmit(onSubmit)}>
          <input {...register('apartment_reservation_id')} readOnly hidden />
          <div className={styles.inputWrapper}>
            <Controller
              name="valid_until"
              control={control}
              render={({ field }) => (
                <DateInput
                  id="valid_until"
                  label={t(`${T_PATH}.offerDueDate`)}
                  helperText={t(`${T_PATH}.dateFormatHelpText`)}
                  language={getCurrentLangCode()}
                  disableConfirmation
                  disabled={offer && !!offer.concluded_at}
                  invalid={Boolean(get(errors, 'valid_until')) || !moment(validUntilDate, 'D.M.YYYY', true).isValid()}
                  errorText={get(errors, 'valid_until')?.message}
                  onChange={(value) => setValue('valid_until', value)}
                  required
                  value={field.value}
                />
              )}
            />
          </div>
          <div className={styles.inputWrapper}>
            <TextArea
              id="comment"
              label={t(`${T_PATH}.offerComment`)}
              rows={3}
              helperText={t(`${T_PATH}.offerCommentDescription`)}
              invalid={Boolean(errors.comment)}
              errorText={errors.comment?.message}
              {...register('comment')}
            />
          </div>
          {!!offer && (
            <div className={cx(styles.inputWrapper, styles.radioWrapper)}>
              <SelectionGroup label={t(`${T_PATH}.offerState`)} required>
                <Controller
                  name="state"
                  control={control}
                  render={({ field }) => (
                    <RadioButton
                      id="state_pending"
                      checked={field.value === OfferState.PENDING}
                      disabled={!!offer.concluded_at}
                      label={getRadioLabel(OfferState.PENDING)}
                      onChange={(e) => setValue('state', e.target.value as OfferState)}
                      required
                      value={OfferState.PENDING}
                    />
                  )}
                />
                <Controller
                  name="state"
                  control={control}
                  render={({ field }) => (
                    <RadioButton
                      id="state_accepted"
                      checked={field.value === OfferState.ACCEPTED}
                      disabled={!!offer.concluded_at}
                      label={getRadioLabel(OfferState.ACCEPTED)}
                      onChange={(e) => setValue('state', e.target.value as OfferState)}
                      required
                      value={OfferState.ACCEPTED}
                    />
                  )}
                />
                <Controller
                  name="state"
                  control={control}
                  render={({ field }) => (
                    <RadioButton
                      id="state_rejected"
                      checked={field.value === OfferState.REJECTED}
                      disabled={!!offer.concluded_at}
                      label={getRadioLabel(OfferState.REJECTED)}
                      onChange={(e) => setValue('state', e.target.value as OfferState)}
                      required
                      value={OfferState.REJECTED}
                    />
                  )}
                />
              </SelectionGroup>
              {isRejectSelected && (
                <div className={styles.radioHelpText}>
                  {ownershipType.toLowerCase() === 'haso'
                    ? t(`${T_PATH}.toggleDeclineHelpHaso`)
                    : t(`${T_PATH}.toggleDeclineHelpHitas`)}
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default OfferForm;
