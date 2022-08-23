import React, { useState } from 'react';
import { Button, Dialog, IconInfoCircle } from 'hds-react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';

import ReservationEditForm from './ReservationEditForm';
import { RootState } from '../../redux/store';
import { toast } from '../common/toast/ToastManager';
import { hideReservationEditModal } from '../../redux/features/reservationEditModalSlice';
import { ReservationEditFormData } from '../../types';
import { useSetApartmentReservationStateMutation } from '../../redux/services/api';

import styles from './ReservationModal.module.scss';

const T_PATH = 'components.reservations.ReservationEditModal';

const ReservationEditModal = (): JSX.Element | null => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const reservationEditModal = useSelector((state: RootState) => state.reservationEditModal);
  const isDialogOpen = reservationEditModal.isOpened;
  const reservation = reservationEditModal.content?.reservation;
  const [isLoading, setIsLoading] = useState(false);
  const [setApartmentReservationState, { isLoading: postReservationStateLoading }] =
    useSetApartmentReservationStateMutation();

  // Project uuid is used to refetch project data (including reservations) after editing reservation state
  const projectId = reservationEditModal.content?.projectId || '';

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

  const handleFormCallback = async (formData: ReservationEditFormData) => {
    if (!postReservationStateLoading) {
      setIsLoading(true);

      try {
        // Send reservation edit form data to API
        await setApartmentReservationState({ formData, reservationId: reservation.id, projectId: projectId })
          .unwrap()
          .then(() => {
            toast.show({ type: 'success', content: t(`${T_PATH}.formSentSuccessfully`) });
            setIsLoading(false);
            closeDialog();
          });
      } catch (err: any) {
        toast.show({ type: 'error' });
        console.error(err);
        setIsLoading(false);
      }
    }
  };

  const formId = `reservation-edit-form-${reservation.id}`;

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
        iconLeft={<IconInfoCircle aria-hidden />}
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
      </Dialog.Content>
      <Dialog.ActionButtons>
        <Button variant="primary" type="submit" form={formId} disabled={isLoading}>
          {t(`${T_PATH}.edit`)}
        </Button>
        <Button variant="secondary" onClick={() => closeDialog()}>
          {t(`${T_PATH}.cancel`)}
        </Button>
      </Dialog.ActionButtons>
    </Dialog>
  );
};

export default ReservationEditModal;
