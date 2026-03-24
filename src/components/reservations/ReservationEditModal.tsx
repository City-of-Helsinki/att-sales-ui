import React, { useEffect, useRef, useState } from 'react';
import { Button, ButtonVariant, Dialog, IconArrowRight, IconInfoCircle, IconSize } from 'hds-react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';

import ReservationEditForm from './ReservationEditForm';
import { ApartmentReservationStates } from '../../enums';
import { RootState } from '../../redux/store';
import { toast } from '../common/toast/ToastManager';
import { hideReservationEditModal } from '../../redux/features/reservationEditModalSlice';
import { ApartmentReservationWithCustomer, ReservationEditFormData } from '../../types';
import {
  useGetApartmentReservationsQuery,
  usePreviewApartmentQueueChangeMutation,
  useSetApartmentReservationStateMutation,
} from '../../redux/services/api';

import styles from './ReservationModal.module.scss';

const T_PATH = 'components.reservations.ReservationEditModal';
type PreviewSubmitMode = 'confirm' | 'update_preview';

const ReservationEditModal = (): JSX.Element | null => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const reservationEditModal = useSelector((state: RootState) => state.reservationEditModal);
  const isDialogOpen = reservationEditModal.isOpened;
  const reservation = reservationEditModal.content?.reservation;
  const [isLoading, setIsLoading] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<ReservationEditFormData | null>(null);
  const [previewSubmitMode, setPreviewSubmitMode] = useState<PreviewSubmitMode>('confirm');
  const previewDebounceRef = useRef<number | null>(null);
  const [lastPreviewPayload, setLastPreviewPayload] = useState<string | null>(null);
  const [latestFormData, setLatestFormData] = useState<ReservationEditFormData>({
    state: reservation?.state || ApartmentReservationStates.RESERVED,
    comment: '',
    queue_position: reservation?.queue_position ?? null,
    submitted_late: reservation?.submitted_late ?? false,
  });
  const [previewReservations, setPreviewReservations] = useState<ApartmentReservationWithCustomer[]>([]);
  const { data: currentReservations } = useGetApartmentReservationsQuery(reservation?.apartment_uuid || '', {
    skip: !reservation?.apartment_uuid,
  });
  const [previewApartmentQueueChange, { isLoading: previewLoading }] = usePreviewApartmentQueueChangeMutation();
  const [setApartmentReservationState, { isLoading: postReservationStateLoading }] =
    useSetApartmentReservationStateMutation();

  useEffect(() => {
    if (!reservation) return;
    const initialFormData = {
      state: reservation.state,
      comment: '',
      queue_position: reservation.queue_position ?? null,
      submitted_late: reservation.submitted_late,
    };
    setLatestFormData(initialFormData);
    setLastPreviewPayload(JSON.stringify(initialFormData));
  }, [reservation]);

  const runPreview = async (
    formData: ReservationEditFormData,
    showToast: boolean,
    activateConfirmFlow: boolean = true
  ) => {
    if (!reservation) return;
    const previewData = await previewApartmentQueueChange({
      apartmentId: reservation.apartment_uuid,
      formData: {
        reservation_id: reservation.id,
        ...formData,
      },
    }).unwrap();
    if (activateConfirmFlow) {
      setPendingFormData(formData);
    }
    setLastPreviewPayload(JSON.stringify(formData));
    setPreviewReservations(previewData);
    if (showToast) {
      toast.show({ type: 'success', content: t(`${T_PATH}.previewReady`) });
    }
  };

  const handleFormCallback = async (
    formData: ReservationEditFormData,
    submitMode: PreviewSubmitMode = previewSubmitMode
  ) => {
    if (!postReservationStateLoading && !previewLoading) {
      setIsLoading(true);

      try {
        if (pendingFormData && submitMode === 'confirm') {
          await persistReservationState(pendingFormData);
          toast.show({ type: 'success', content: t(`${T_PATH}.formSentSuccessfully`) });
          setPendingFormData(null);
          setPreviewReservations([]);
          setIsLoading(false);
          closeDialog();
          return;
        }

        await runPreview(formData, true);
        setIsLoading(false);
      } catch (err: any) {
        toast.show({ type: 'error' });
        console.error(err);
        setIsLoading(false);
      }
    }
  };

  const formId = `reservation-edit-form-${reservation?.id ?? 'unknown'}`;
  const updatePreview = () => {
    void handleFormCallback(latestFormData, 'update_preview');
  };

  useEffect(() => {
    // Keep preview responsive while protecting backend capacity:
    // call only for changed payloads and debounce rapid field edits.
    if (!isDialogOpen || !reservation) return;
    if (postReservationStateLoading || previewLoading) return;

    const nextPayload = JSON.stringify(latestFormData);
    if (nextPayload === lastPreviewPayload) return;

    if (previewDebounceRef.current) {
      window.clearTimeout(previewDebounceRef.current);
    }

    previewDebounceRef.current = window.setTimeout(() => {
      void runPreview(latestFormData, false, false).catch((err) => {
        console.error(err);
      });
    }, 700);

    return () => {
      if (previewDebounceRef.current) {
        window.clearTimeout(previewDebounceRef.current);
      }
    };
  }, [isDialogOpen, lastPreviewPayload, latestFormData, postReservationStateLoading, previewLoading, reservation]);

  if (!isDialogOpen) return null;

  if (!reservation) {
    toast.show({
      type: 'error',
      title: t(`${T_PATH}.errorTitle`),
      content: t(`${T_PATH}.noReservation`),
    });

    return null;
  }

  const closeDialog = () => {
    if (previewDebounceRef.current) {
      window.clearTimeout(previewDebounceRef.current);
    }
    setPendingFormData(null);
    setLastPreviewPayload(null);
    setPreviewReservations([]);
    setPreviewSubmitMode('confirm');
    dispatch(hideReservationEditModal());
  };

  const persistReservationState = async (formData: ReservationEditFormData) => {
    // These ids are passed so RTK Query invalidation can refresh the list views
    // immediately after save without requiring a manual reload.
    const projectId = reservationEditModal.content?.projectId || '';
    const apartmentId = reservationEditModal.content?.apartmentId || '';

    await setApartmentReservationState({
      formData,
      reservationId: reservation.id,
      projectId: projectId,
      apartmentId: apartmentId,
    }).unwrap();
  };
  const currentPositionsById = new Map(
    (currentReservations || []).map((current) => [current.id, current.queue_position])
  );
  const previewRows = previewReservations.length > 0 ? previewReservations : currentReservations || [];
  // Sales users optimize active queue order; hiding canceled rows reduces noise
  // and makes actual position changes easier to validate quickly.
  const activeRows = previewRows
    .filter((row) => row.state !== ApartmentReservationStates.CANCELED)
    .sort((a, b) => (a.queue_position || 0) - (b.queue_position || 0));

  return (
    <Dialog
      id={`reservation-edit-dialog-${reservation.id}`}
      aria-labelledby="reservation-edit-dialog-header"
      isOpen={isDialogOpen}
      close={closeDialog}
      closeButtonLabelText={t(`${T_PATH}.closeDialog`)}
      className={styles.reservationEditDialog}
    >
      <Dialog.Header
        id="reservation-edit-dialog-header"
        title={t(`${T_PATH}.reservationEdit`)}
        iconStart={<IconInfoCircle aria-hidden />}
      />
      <Dialog.Content>
        <div className={styles.editDialogContent}>
          <div className={styles.editDialogFormColumn}>
            <div className={styles.customer}>
              {t(`${T_PATH}.editingForCustomer`)}:
              <div className={styles.applicants}>
                {reservation.customer.primary_profile.last_name} {reservation.customer.primary_profile.first_name}
                {reservation.customer.secondary_profile &&
                  ` (${reservation.customer.secondary_profile.last_name}, ${reservation.customer.secondary_profile.first_name})`}
              </div>
            </div>
            <ReservationEditForm
              reservation={reservation}
              handleFormCallback={handleFormCallback}
              handleFormValuesChange={setLatestFormData}
              formId={formId}
            />
            <div className={styles.inlineDialogActionButtons}>
              <Button
                variant={ButtonVariant.Primary}
                type="submit"
                form={formId}
                disabled={isLoading}
                onClick={() => setPreviewSubmitMode('confirm')}
              >
                {pendingFormData ? t(`${T_PATH}.confirm`) : t(`${T_PATH}.edit`)}
              </Button>
              {pendingFormData && (
                <Button variant={ButtonVariant.Secondary} type="button" disabled={isLoading} onClick={updatePreview}>
                  {t(`${T_PATH}.reject`)}
                </Button>
              )}
              <Button variant={ButtonVariant.Secondary} onClick={() => closeDialog()}>
                {t(`${T_PATH}.cancel`)}
              </Button>
            </div>
          </div>
          {previewRows.length > 0 && (
            <div className={styles.editDialogPreviewColumn}>
              <strong>{t(`${T_PATH}.previewTitle`)}</strong>
              <div className={styles.previewSectionTitle}>{t(`${T_PATH}.previewActive`)}</div>
              <div className={styles.previewSectionColumn}>
                {activeRows.map((previewReservation) => {
                  const oldPosition = currentPositionsById.get(previewReservation.id);
                  const newPosition = previewReservation.queue_position;
                  const showDiff =
                    oldPosition !== undefined &&
                    oldPosition !== null &&
                    newPosition !== undefined &&
                    newPosition !== null;
                  const isChanged = Boolean(pendingFormData) && showDiff && oldPosition !== newPosition;
                  const isEditedReservation = previewReservation.id === reservation.id;

                  return (
                    <div
                      key={previewReservation.id}
                      className={`${styles.previewRow} ${isChanged ? styles.previewRowChanged : ''} ${
                        isEditedReservation ? styles.previewRowEdited : ''
                      }`}
                    >
                      <span className={styles.previewRowPosition}>
                        {showDiff ? (
                          oldPosition !== newPosition ? (
                            <span className={styles.previewPositionDiff}>
                              <span>{oldPosition}</span>
                              <IconArrowRight size={IconSize.ExtraSmall} aria-hidden />
                              <span>{newPosition}</span>
                            </span>
                          ) : (
                            `${newPosition}.`
                          )
                        ) : (
                          `${newPosition}.`
                        )}
                      </span>
                      <span className={styles.previewRowName}>
                        {previewReservation.customer.primary_profile.last_name}{' '}
                        {previewReservation.customer.primary_profile.first_name}
                        {isEditedReservation && (
                          <span className={styles.previewEditedTag}> {t(`${T_PATH}.previewEdited`)}</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Dialog.Content>
    </Dialog>
  );
};

export default ReservationEditModal;
