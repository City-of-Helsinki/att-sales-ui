import React, { useCallback, useState } from 'react';
import { Button, Dialog, IconInfoCircle, Notification } from 'hds-react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';

import {
  hideApartmentRevaluationModal,
  startEditing,
  stopEditing,
} from '../../redux/features/apartmentRevaluationModalSlice';
import { useAddApartmentRevaluationMutation, useUpdateApartmentRevaluationMutation } from '../../redux/services/api';
import { RootState } from '../../redux/store';
import parseApiErrors from '../../utils/parseApiErrors';
import { toast } from '../common/toast/ToastManager';
import { ApartmentRevaluation } from '../../types';
import ReservationReleasePDF from '../reservations/ReservationReleasePDF';
import ApartmentRevaluationFormContainer from './ApartmentRevaluationFormContainer';

const T_PATH = 'components.revaluation.ApartmentRevaluationModal';

const ApartmentRevaluationModal = (): JSX.Element | null => {
  const { t: translate } = useTranslation();
  const t = (label: string) => translate(`${T_PATH}.${label}`);

  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const dispatch = useDispatch();
  const dispatchStartEditing = useCallback(() => dispatch(startEditing()), [dispatch]);
  const apartmentRevaluationModal = useSelector((state: RootState) => state.apartmentRevaluationModal);
  const isDialogOpen = apartmentRevaluationModal.isOpened;
  const apartmentId = apartmentRevaluationModal.content?.apartmentId;
  const reservationId = apartmentRevaluationModal.content?.reservationId;
  const customer = apartmentRevaluationModal.content?.customer;
  const revaluation = apartmentRevaluationModal.content?.revaluation;
  const editing = apartmentRevaluationModal.isEditing;

  const [isLoading, setIsLoading] = useState(false);
  const [addApartmentRevaluation, { isLoading: isAddApartmentRevaluationLoading }] =
    useAddApartmentRevaluationMutation();

  const [updateApartmentRevaluation, { isLoading: isUpdateApartmentRevaluationLoading }] =
    useUpdateApartmentRevaluationMutation();

  if (!isDialogOpen) return null;

  if (!apartmentId || !reservationId || !customer) {
    toast.show({
      type: 'error',
      title: t('errorTitle'),
      content: t('noApartmentReservationOrCustomer'),
    });

    return null;
  }

  const closeDialog = () => {
    dispatch(hideApartmentRevaluationModal());
  };

  const handleFormCallback = async (formData: ApartmentRevaluation) => {
    setIsLoading(true);
    try {
      if (revaluation) {
        await updateApartmentRevaluation({ formData, id: revaluation.id, apartmentId: apartmentId })
          .unwrap()
          .then(() => {
            toast.show({ type: 'success', content: t('revaluationUpdateSuccess') });
            setIsLoading(false);
            dispatch(stopEditing());
          });
      } else {
        await addApartmentRevaluation({
          formData,
          apartmentId: apartmentId,
        })
          .unwrap()
          .then(() => {
            toast.show({ type: 'success', content: t('revaluationAddSuccess') });
            setIsLoading(false);
            dispatch(stopEditing());
          });
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessages(parseApiErrors(err));
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      id={`apartment-revaluation-dialog-${reservationId}`}
      aria-labelledby="apartment-revaluation-dialog-header"
      isOpen={isDialogOpen}
      close={closeDialog}
      closeButtonLabelText={t('closeDialog')}
    >
      <Dialog.Header
        id="apartment-revaluation-dialog-header"
        title={t('title')}
        iconLeft={<IconInfoCircle aria-hidden />}
      />
      {!!errorMessages.length && (
        <Notification type="error" style={{ margin: '15px 0' }}>
          <ul>
            {errorMessages.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Notification>
      )}

      <Dialog.ActionButtons>
        <ReservationReleasePDF reservationId={reservationId} customerId={customer.id} disabled={editing} />
        <Button variant="secondary" onClick={dispatchStartEditing} disabled={editing}>
          {t('edit')}
        </Button>
      </Dialog.ActionButtons>

      <ApartmentRevaluationFormContainer
        revaluation={revaluation}
        apartmentId={apartmentId}
        reservationId={reservationId}
        customer={customer}
        closeDialog={closeDialog}
        handleFormCallback={handleFormCallback}
        isLoading={isAddApartmentRevaluationLoading || isUpdateApartmentRevaluationLoading || isLoading}
        editing={editing}
      />
    </Dialog>
  );
};

export default ApartmentRevaluationModal;
