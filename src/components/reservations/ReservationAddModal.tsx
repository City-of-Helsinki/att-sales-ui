import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm, SubmitHandler, get } from 'react-hook-form';
import { Button, ButtonVariant, Checkbox, Dialog, IconArrowRight, IconSize, TextInput } from 'hds-react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import ReservationApartmentDetails from './ReservationApartmentDetails';
import SelectCustomerDropdown from '../customers/SelectCustomerDropdown';
import { RootState } from '../../redux/store';
import { toast } from '../common/toast/ToastManager';
import { hideReservationAddModal } from '../../redux/features/reservationAddModalSlice';
import { ApartmentReservationWithCustomer, ReservationAddFormData } from '../../types';
import { ApartmentReservationStates } from '../../enums';
import {
  useCreateApartmentReservationMutation,
  useGetApartmentReservationsQuery,
  usePreviewApartmentQueueChangeMutation,
} from '../../redux/services/api';

import styles from './ReservationModal.module.scss';

const T_PATH = 'components.reservations.ReservationAddModal';

const ReservationAddModal = (): JSX.Element | null => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const reservationAddModal = useSelector((state: RootState) => state.reservationAddModal);
  const isDialogOpen = reservationAddModal.isOpened;
  const apartment = reservationAddModal.content?.apartment;
  const project = reservationAddModal.content?.project;
  const [isLoading, setIsLoading] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<ReservationAddFormData | null>(null);
  const [previewReservations, setPreviewReservations] = useState<ApartmentReservationWithCustomer[]>([]);
  const { data: currentReservations } = useGetApartmentReservationsQuery(apartment?.apartment_uuid || '', {
    skip: !apartment?.apartment_uuid,
  });
  const [previewApartmentQueueChange, { isLoading: previewLoading }] = usePreviewApartmentQueueChangeMutation();
  const [createApartmentReservation, { isLoading: postCreateReservationLoading }] =
    useCreateApartmentReservationMutation();
  const schema = yup.object({
    apartment_uuid: yup.string().required(t(`${T_PATH}.apartmentRequired`)),
    customer_id: yup.string().required(t(`${T_PATH}.customerRequired`)),
    queue_position: yup
      .number()
      .nullable()
      .transform((value, originalValue) => (originalValue === '' ? null : value))
      .integer(t(`${T_PATH}.queuePositionInteger`))
      .min(1, t(`${T_PATH}.queuePositionMin`)),
    submitted_late: yup.bool().optional(),
  });
  const {
    control,
    handleSubmit,
    register,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ReservationAddFormData>({
    resolver: yupResolver(schema),
  });

  const activeReservations = useMemo(
    () =>
      (currentReservations || []).filter((reservation) => reservation.state !== ApartmentReservationStates.CANCELED),
    [currentReservations]
  );
  const maxExistingQueuePosition = Math.max(
    0,
    ...activeReservations.map((reservation) => reservation.queue_position ?? 0)
  );
  const suggestedQueuePosition = maxExistingQueuePosition + 1;

  useEffect(() => {
    if (apartment) {
      setValue('apartment_uuid', apartment.apartment_uuid);
      setValue('submitted_late', false);
    }
  }, [apartment, setValue]);

  // Suggest max(existing queue_position among active reservations) + 1 once data
  // has loaded. Only fires once per apartment so user edits are preserved across refetches.
  const queuePositionInitializedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!apartment || !currentReservations) return;
    if (queuePositionInitializedRef.current === apartment.apartment_uuid) return;
    queuePositionInitializedRef.current = apartment.apartment_uuid;
    setValue('queue_position', suggestedQueuePosition);
  }, [apartment, currentReservations, suggestedQueuePosition, setValue]);

  const handleSelectCallback = (customerId: string) => {
    setValue('customer_id', customerId);
  };

  // ReservationAddModal is always mounted in MainLayout and only returns null
  // when closed, so internal state survives close/reopen unless explicitly
  // cleared here.
  const closeDialog = () => {
    setPendingFormData(null);
    setPreviewReservations([]);
    setIsLoading(false);
    queuePositionInitializedRef.current = null;
    reset({
      apartment_uuid: '',
      customer_id: '',
      queue_position: null,
      submitted_late: false,
    });
    dispatch(hideReservationAddModal());
  };

  const persistReservation = async (data: ReservationAddFormData) => {
    const projectId = project?.uuid || '';
    const apartmentId = apartment?.apartment_uuid || '';
    await createApartmentReservation({ formData: data, projectId: projectId, apartmentId: apartmentId }).unwrap();
  };

  const handleFormSubmit = async (data: ReservationAddFormData) => {
    if (!postCreateReservationLoading && !previewLoading) {
      setIsLoading(true);

      try {
        if (pendingFormData) {
          await persistReservation(pendingFormData);
          toast.show({ type: 'success', content: t(`${T_PATH}.createdSuccessfully`) });
          setPendingFormData(null);
          setPreviewReservations([]);
          setIsLoading(false);
          closeDialog();
          return;
        }

        const previewData = await previewApartmentQueueChange({
          apartmentId: apartment?.apartment_uuid || '',
          formData: {
            customer_id: data.customer_id,
            queue_position: data.queue_position,
            submitted_late: data.submitted_late,
          },
        }).unwrap();
        setPendingFormData(data);
        setPreviewReservations(previewData);
        toast.show({ type: 'success', content: t(`${T_PATH}.previewReady`) });
        setIsLoading(false);
      } catch (err: any) {
        toast.show({ type: 'error' });
        console.error(err);
        setIsLoading(false);
      }
    }
  };

  const onSubmit: SubmitHandler<ReservationAddFormData> = (data, event) => {
    event?.preventDefault();
    handleFormSubmit(data);
  };

  if (!isDialogOpen) return null;

  if (!project || !apartment) {
    toast.show({
      type: 'error',
      title: t(`${T_PATH}.errorTitle`),
      content: t(`${T_PATH}.noApartmentOrProject`),
    });

    return null;
  }

  const formId = `reservation-add-form-${apartment.apartment_uuid}`;
  const currentPositionsById = new Map(
    (currentReservations || []).map((current) => [current.id, current.queue_position])
  );
  const rejectPreview = () => {
    setPendingFormData(null);
    setPreviewReservations([]);
  };

  return (
    <Dialog
      id={`reservation-add-dialog-${apartment.apartment_uuid}`}
      aria-labelledby="reservation-add-dialog-header"
      isOpen={isDialogOpen}
      close={closeDialog}
      closeButtonLabelText={t(`${T_PATH}.closeDialog`)}
      className={styles.reservationAddDialog}
      variant="primary"
    >
      <Dialog.Header id="reservation-add-dialog-header" title={t(`${T_PATH}.addApplicant`)} />
      <Dialog.Content>
        <ReservationApartmentDetails project={project} apartment={apartment} />
        <form id={formId} onSubmit={handleSubmit(onSubmit)}>
          <SelectCustomerDropdown
            handleSelectCallback={handleSelectCallback}
            errorMessage={get(errors, 'customer_id')?.message}
            hasError={Boolean(get(errors, 'customer_id'))}
            isOpen={!pendingFormData}
            ownershipType={project.ownership_type}
          />
          <input {...register('customer_id')} readOnly hidden />
          <input {...register('apartment_uuid')} readOnly hidden />
          <TextInput
            id="queuePosition"
            type="number"
            label={t(`${T_PATH}.queuePosition`)}
            invalid={Boolean(errors.queue_position)}
            errorText={errors.queue_position?.message}
            min={1}
            max={suggestedQueuePosition}
            style={{ marginTop: '1rem' }}
            {...register('queue_position', {
              setValueAs: (value) => (value === '' ? null : Number(value)),
            })}
          />
          <Controller
            name="submitted_late"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="submittedLate"
                label={t(`${T_PATH}.submittedLate`)}
                style={{ marginTop: '1rem' }}
                checked={Boolean(field.value)}
                onChange={(event) => field.onChange(event.target.checked)}
              />
            )}
          />
        </form>
        {pendingFormData && (
          <div className={styles.editDialogPreviewColumn} style={{ marginTop: '1rem' }}>
            <strong>{t(`${T_PATH}.previewTitle`)}</strong>
            <div className={styles.previewSectionColumn}>
              {/* New applicant placement decisions are made against active queue;
                  hiding canceled rows keeps the confirmation view focused. */}
              {previewReservations
                .filter((previewReservation) => previewReservation.state !== ApartmentReservationStates.CANCELED)
                .sort((a, b) => (a.queue_position || 0) - (b.queue_position || 0))
                .map((previewReservation) => {
                  const oldPosition = currentPositionsById.get(previewReservation.id);
                  const newPosition = previewReservation.queue_position;
                  // The added reservation has no matching id among current reservations;
                  // treat it like the "edited" row in ReservationEditModal so it stands out.
                  const isNewReservation = oldPosition === undefined;
                  const showDiff =
                    !isNewReservation && oldPosition !== null && newPosition !== undefined && newPosition !== null;
                  const isChanged = showDiff && oldPosition !== newPosition;
                  return (
                    <div
                      key={`${previewReservation.id ?? 'new'}-${newPosition ?? 'x'}`}
                      data-testid={`preview-row-${previewReservation.id ?? 'new'}`}
                      className={`${styles.previewRow} ${isChanged ? styles.previewRowChanged : ''} ${
                        isNewReservation ? styles.previewRowEdited : ''
                      }`}
                    >
                      <span className={styles.previewRowPosition}>
                        {isChanged ? (
                          <span className={styles.previewPositionDiff}>
                            <span>{oldPosition}</span>
                            <IconArrowRight size={IconSize.ExtraSmall} aria-hidden />
                            <span>{newPosition}</span>
                          </span>
                        ) : (
                          `${newPosition}.`
                        )}
                      </span>
                      <span className={styles.previewRowName}>
                        {previewReservation.customer.primary_profile.last_name}{' '}
                        {previewReservation.customer.primary_profile.first_name}
                        {isNewReservation && (
                          <span className={styles.previewEditedTag}> {t(`${T_PATH}.previewAdded`)}</span>
                        )}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </Dialog.Content>
      <Dialog.ActionButtons>
        <Button variant={ButtonVariant.Primary} type="submit" form={formId} disabled={isLoading}>
          {pendingFormData ? t(`${T_PATH}.confirm`) : t(`${T_PATH}.addBtn`)}
        </Button>
        {pendingFormData && (
          <Button variant={ButtonVariant.Secondary} type="button" onClick={rejectPreview}>
            {t(`${T_PATH}.reject`)}
          </Button>
        )}
        <Button variant={ButtonVariant.Secondary} onClick={() => closeDialog()}>
          {t(`${T_PATH}.cancelBtn`)}
        </Button>
      </Dialog.ActionButtons>
    </Dialog>
  );
};

export default ReservationAddModal;
