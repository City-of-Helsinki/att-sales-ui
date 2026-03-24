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
import formattedLivingArea from '../../utils/formatLivingArea';
import Label from '../common/label/Label';

import styles from './ReservationModal.module.scss';

const T_PATH = 'components.reservations.ReservationEditModal';

const ReservationEditModal = (): JSX.Element | null => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const reservationEditModal = useSelector((state: RootState) => state.reservationEditModal);
  const isDialogOpen = reservationEditModal.isOpened;
  const reservation = reservationEditModal.content?.reservation;
  const apartment = reservationEditModal.content?.apartment;
  const project = reservationEditModal.content?.project;
  const [isLoading, setIsLoading] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<ReservationEditFormData | null>(null);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
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

  const hasReservationChanges = (formData: ReservationEditFormData): boolean => {
    if (!reservation) return false;

    const normalizedQueuePosition =
      formData.queue_position === undefined ? reservation.queue_position ?? null : formData.queue_position;
    const normalizedSubmittedLate =
      formData.submitted_late === undefined ? reservation.submitted_late : formData.submitted_late;

    return (
      formData.state !== reservation.state ||
      normalizedQueuePosition !== (reservation.queue_position ?? null) ||
      normalizedSubmittedLate !== reservation.submitted_late
    );
  };

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

  const runPreview = async (formData: ReservationEditFormData, activateConfirmFlow: boolean = true) => {
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
      setShowSaveConfirmation(true);
    }
    setLastPreviewPayload(JSON.stringify(formData));
    setPreviewReservations(previewData);
  };

  const handleFormCallback = async (formData: ReservationEditFormData) => {
    if (!postReservationStateLoading && !previewLoading) {
      setIsLoading(true);

      try {
        if (pendingFormData) {
          if (!hasReservationChanges(pendingFormData)) {
            setIsLoading(false);
            setShowSaveConfirmation(false);
            setPendingFormData(null);
            setPreviewReservations([]);
            return;
          }
          await persistReservationState(pendingFormData);
          toast.show({ type: 'success', content: t(`${T_PATH}.formSentSuccessfully`) });
          setPendingFormData(null);
          setShowSaveConfirmation(false);
          setPreviewReservations([]);
          setIsLoading(false);
          closeDialog();
          return;
        }

        if (!hasReservationChanges(formData)) {
          setIsLoading(false);
          setShowSaveConfirmation(false);
          setPendingFormData(null);
          setPreviewReservations([]);
          return;
        }

        await runPreview(formData);
        setIsLoading(false);
      } catch (err: any) {
        toast.show({ type: 'error' });
        console.error(err);
        setIsLoading(false);
      }
    }
  };

  const formId = `reservation-edit-form-${reservation?.id ?? 'unknown'}`;

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
      void runPreview(latestFormData, false).catch((err) => {
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
    setShowSaveConfirmation(false);
    setPreviewReservations([]);
    dispatch(hideReservationEditModal());
  };

  const resetConfirmState = () => {
    setPendingFormData(null);
    setShowSaveConfirmation(false);
    setPreviewReservations([]);
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
  const maxQueuePosition = Math.max(
    ...activeRows.map((row) => row.queue_position || 0),
    reservation.queue_position || 0,
    1
  );

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
            {project && apartment && (
              <div className={styles.details}>
                <div className={styles.projectHousingCompany}>
                  <Label type={project.ownership_type}>{project.ownership_type}</Label>
                </div>
                <div>
                  <div className={styles.title}>
                    <h3>{project.housing_company}</h3>
                    <span>
                      <strong>{project.district}, </strong>
                      {project.street_address}
                    </span>
                  </div>
                  <div className={styles.apartment}>
                    <strong>{apartment.apartment_number}</strong>
                    <span>&mdash;</span>
                    {apartment.apartment_structure}
                    <span>&mdash;</span>
                    {apartment.living_area && formattedLivingArea(apartment.living_area)}
                  </div>
                </div>
              </div>
            )}
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
              queuePositionMax={maxQueuePosition}
            />
            {showSaveConfirmation && pendingFormData && (
              <div className={styles.saveConfirmationText}>{t(`${T_PATH}.areYouSure`)}</div>
            )}
            <div className={styles.inlineDialogActionButtons}>
              <Button
                variant={ButtonVariant.Primary}
                type="submit"
                form={formId}
                disabled={isLoading || !hasReservationChanges(latestFormData)}
              >
                {pendingFormData ? t(`${T_PATH}.confirm`) : t(`${T_PATH}.save`)}
              </Button>
              <Button
                variant={ButtonVariant.Secondary}
                onClick={() => {
                  if (pendingFormData || showSaveConfirmation) {
                    resetConfirmState();
                    return;
                  }
                  closeDialog();
                }}
              >
                {t(`${T_PATH}.cancel`)}
              </Button>
            </div>
          </div>
          {previewRows.length > 0 && (
            <div className={styles.editDialogPreviewColumn}>
              <strong>{t(`${T_PATH}.previewTitle`)}</strong>
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
