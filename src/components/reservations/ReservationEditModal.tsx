import React, { useState } from 'react';
import { Button, ButtonVariant, Dialog, IconInfoCircle } from 'hds-react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';

import ReservationEditForm from './ReservationEditForm';
import { RootState } from '../../redux/store';
import { toast } from '../common/toast/ToastManager';
import { hideReservationEditModal } from '../../redux/features/reservationEditModalSlice';
import { ApartmentReservationWithCustomer, ReservationEditFormData } from '../../types';
import {
  usePreviewApartmentQueueChangeMutation,
  useSetApartmentReservationStateMutation,
} from '../../redux/services/api';

import styles from './ReservationModal.module.scss';

const T_PATH = 'components.reservations.ReservationEditModal';

const ReservationEditModal = (): JSX.Element | null => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const reservationEditModal = useSelector((state: RootState) => state.reservationEditModal);
  const isDialogOpen = reservationEditModal.isOpened;
  const reservation = reservationEditModal.content?.reservation;
  const [isLoading, setIsLoading] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<ReservationEditFormData | null>(null);
  const [previewReservations, setPreviewReservations] = useState<ApartmentReservationWithCustomer[]>([]);
  const [previewApartmentQueueChange, { isLoading: previewLoading }] = usePreviewApartmentQueueChangeMutation();
  const [setApartmentReservationState, { isLoading: postReservationStateLoading }] =
    useSetApartmentReservationStateMutation();

  if (!isDialogOpen) return null;

  if (!reservation) {
    toast.show({
      type: 'error',
      title: t(`${T_PATH}.errorTitle`),
      content: t(`${T_PATH}.noReservation`),
    });

    return null;
  }

  const closeDialog = () => dispatch(hideReservationEditModal());

  const persistReservationState = async (formData: ReservationEditFormData) => {
    // Project uuid and Apartment uuid is used to invalidate cached data after editing a reservation
    const projectId = reservationEditModal.content?.projectId || '';
    const apartmentId = reservationEditModal.content?.apartmentId || '';

    await setApartmentReservationState({
      formData,
      reservationId: reservation.id,
      projectId: projectId,
      apartmentId: apartmentId,
    }).unwrap();
  };

  const handleFormCallback = async (formData: ReservationEditFormData) => {
    if (!postReservationStateLoading && !previewLoading) {
      setIsLoading(true);

      try {
        if (pendingFormData) {
          await persistReservationState(pendingFormData);
          toast.show({ type: 'success', content: t(`${T_PATH}.formSentSuccessfully`) });
          setPendingFormData(null);
          setPreviewReservations([]);
          setIsLoading(false);
          closeDialog();
          return;
        }

        const previewData = await previewApartmentQueueChange({
          apartmentId: reservation.apartment_uuid,
          formData: {
            reservation_id: reservation.id,
            ...formData,
          },
        }).unwrap();
        setPendingFormData(formData);
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

  const formId = `reservation-edit-form-${reservation.id}`;
  const rejectPreview = () => {
    setPendingFormData(null);
    setPreviewReservations([]);
  };

  return (
    <Dialog
      id={`reservation-edit-dialog-${reservation.id}`}
      aria-labelledby="reservation-edit-dialog-header"
      isOpen={isDialogOpen}
      close={closeDialog}
      closeButtonLabelText={t(`${T_PATH}.closeDialog`)}
    >
      <Dialog.Header
        id="reservation-edit-dialog-header"
        title={t(`${T_PATH}.reservationEdit`)}
        iconStart={<IconInfoCircle aria-hidden />}
      />
      <Dialog.Content>
        <div className={styles.customer}>
          {t(`${T_PATH}.editingForCustomer`)}:
          <div className={styles.applicants}>
            {reservation.customer.primary_profile.last_name} {reservation.customer.primary_profile.first_name}
            {reservation.customer.secondary_profile &&
              ` (${reservation.customer.secondary_profile.last_name}, ${reservation.customer.secondary_profile.first_name})`}
          </div>
        </div>
        <ReservationEditForm reservation={reservation} handleFormCallback={handleFormCallback} formId={formId} />
        {pendingFormData && (
          <div style={{ marginTop: '1rem' }}>
            <strong>{t(`${T_PATH}.previewTitle`)}</strong>
            {previewReservations.map((previewReservation) => (
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
          {pendingFormData ? t(`${T_PATH}.confirm`) : t(`${T_PATH}.edit`)}
        </Button>
        {pendingFormData && (
          <Button variant={ButtonVariant.Secondary} type="button" onClick={rejectPreview}>
            {t(`${T_PATH}.reject`)}
          </Button>
        )}
        <Button variant={ButtonVariant.Secondary} onClick={() => closeDialog()}>
          {t(`${T_PATH}.cancel`)}
        </Button>
      </Dialog.ActionButtons>
    </Dialog>
  );
};

export default ReservationEditModal;
