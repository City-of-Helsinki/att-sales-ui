import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler, get } from 'react-hook-form';
import { Button, ButtonVariant, Checkbox, Dialog, TextInput } from 'hds-react';
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
    handleSubmit,
    register,
    setValue,
    formState: { errors },
  } = useForm<ReservationAddFormData>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    if (apartment) {
      setValue('apartment_uuid', apartment.apartment_uuid);
      setValue('submitted_late', false);
    }
  }, [apartment, setValue]);

  const handleSelectCallback = (customerId: string) => {
    setValue('customer_id', customerId);
  };

  const closeDialog = () => dispatch(hideReservationAddModal());

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
  const maxQueuePosition = Math.max(
    ...(currentReservations || [])
      .filter((reservation) => reservation.state !== ApartmentReservationStates.CANCELED)
      .map((reservation) => reservation.queue_position || 0),
    1
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
            max={maxQueuePosition}
            style={{ marginTop: '1rem' }}
            {...register('queue_position', {
              setValueAs: (value) => (value === '' ? null : Number(value)),
            })}
          />
          <Checkbox
            id="submittedLate"
            label={t(`${T_PATH}.submittedLate`)}
            style={{ marginTop: '1rem' }}
            {...register('submitted_late')}
          />
        </form>
        {pendingFormData && (
          <div style={{ marginTop: '1rem' }}>
            <strong>{t(`${T_PATH}.previewTitle`)}</strong>
            {/* New applicant placement decisions are made against active queue;
                hiding canceled rows keeps the confirmation view focused. */}
            {previewReservations
              .filter((previewReservation) => previewReservation.state !== ApartmentReservationStates.CANCELED)
              .map((previewReservation) => (
                <div key={previewReservation.id}>
                  {previewReservation.queue_position}. {previewReservation.customer.primary_profile.last_name}{' '}
                  {previewReservation.customer.primary_profile.first_name}
                </div>
              ))}
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
