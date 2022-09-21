import React, { useRef, useState } from 'react';
import cx from 'classnames';
import { Button, Dialog, Notification, Tooltip } from 'hds-react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import OfferForm from './OfferForm';
import ProjectName from '../project/ProjectName';
import Spinner from '../common/spinner/Spinner';
import { ApartmentReservationOffer, OfferFormData } from '../../types';
import { OfferState } from '../../enums';
import { RootState } from '../../redux/store';
import { formattedLivingArea } from '../../utils/formatLivingArea';
import { hideOfferModal } from '../../redux/features/offerModalSlice';
import { renderBooleanTextualValue } from '../../utils/renderBooleanTextualValue';
import { renderOfferDate, renderOfferState } from '../../utils/getOfferText';
import { toast } from '../common/toast/ToastManager';
import { useCreateOfferMutation, useGetOfferByIdQuery, useUpdateOfferByIdMutation } from '../../redux/services/api';

import styles from './OfferModal.module.scss';

const T_PATH = 'components.offer.OfferModal';

const OfferModal = (): JSX.Element | null => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const offerModal = useSelector((state: RootState) => state.offerModal);
  const openConfirmDialogButtonRef = useRef(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const closeOfferDialog = () => dispatch(hideOfferModal());
  const closeConfirmDialog = () => setIsConfirmDialogOpen(false);

  const isOfferDialogOpen = offerModal.isOpened;
  const apartment = offerModal.content?.apartment;
  const customer = offerModal.content?.customer;
  const isNewOffer = offerModal.content?.isNewOffer;
  const project = offerModal.content?.project;
  const reservation = offerModal.content?.reservation;
  const offerId = reservation?.offer?.id || 0;
  const apartmentId = offerModal.content?.apartment?.apartment_uuid || '';

  const {
    data: offer,
    isLoading: offerIsLoading,
    isError: offerIsError,
  } = useGetOfferByIdQuery(offerId, { skip: isNewOffer || offerId === 0 });
  const [createOffer, { isLoading: isCreatingOffer }] = useCreateOfferMutation();
  const [updateOfferById, { isLoading: isUpdatingOffer }] = useUpdateOfferByIdMutation();

  if (!isOfferDialogOpen) return null;

  if (!project || !apartment || !customer || !reservation) {
    toast.show({
      type: 'error',
      title: t(`${T_PATH}.missingValuesErrorTitle`),
      content: t(`${T_PATH}.noRequiredDataAvailable`),
    });

    return null;
  }

  const apiErrorToast = () =>
    toast.show({
      type: 'error',
      title: t(`${T_PATH}.errorSavingOfferTitle`),
      content: t(`${T_PATH}.errorSavingOfferContent`),
    });

  const handleCreateOffer = async (formData: OfferFormData) => {
    if (!isCreatingOffer) {
      try {
        await createOffer({
          formData: formData,
          reservationId: reservation.id,
          projectId: project.uuid,
          customerId: customer.id,
          apartmentId: apartmentId,
        })
          .unwrap()
          .then(() => {
            toast.show({ type: 'success', content: t(`${T_PATH}.createdSuccessfully`) });
            closeOfferDialog();
          });
      } catch (err: any) {
        apiErrorToast();
        console.error(err);
      }
    }
  };

  const handleUpdateOffer = async (formData: OfferFormData) => {
    if (!isUpdatingOffer) {
      try {
        await updateOfferById({
          formData: formData,
          offerId: offerId,
          reservationId: reservation.id,
          projectId: project.uuid,
          customerId: customer.id,
          apartmentId: apartmentId,
        })
          .unwrap()
          .then(() => {
            toast.show({ type: 'success', content: t(`${T_PATH}.updatedSuccessfully`) });
            closeOfferDialog();
          });
      } catch (err: any) {
        apiErrorToast();
        console.error(err);
      }
    }
  };

  const handleFormCallback = (formValues: OfferFormData) => {
    // Check if we are creating or updating an offer
    if (isNewOffer) {
      handleCreateOffer(formValues);
    } else {
      // If the existing offer is not in a 'rejected' state and the user is about to save it as 'rejected',
      // then show a confirm dialog for the user
      if (offer?.state !== OfferState.REJECTED && formValues.state === OfferState.REJECTED) {
        if (!isConfirmDialogOpen) {
          // Show confirm dialog if the confirm dialog was not already open
          setIsConfirmDialogOpen(true);
        } else {
          // If the confirm dialog is already open and we click the submit button inside that dialog,
          // then we submit the form
          handleUpdateOffer(formValues);
          setIsConfirmDialogOpen(false);
        }
      } else {
        // Handle regular offer updates
        handleUpdateOffer(formValues);
      }
    }
  };

  const formId = `offer-form-${reservation.id}`;

  const renderConfirmModal = (): JSX.Element | null => {
    if (!isConfirmDialogOpen) return null;

    return (
      <Dialog
        id={`offer-confirm-dialog-${reservation.id}`}
        variant="danger"
        aria-labelledby="offer-confirmation-dialog-header"
        isOpen={isConfirmDialogOpen}
        close={closeConfirmDialog}
        closeButtonLabelText={t(`${T_PATH}.closeDialog`)}
      >
        <Dialog.Header id="offer-confirmation-dialog-header" title={t(`${T_PATH}.confirmDialogTitle`)} />
        <Dialog.Content>
          {project.ownership_type.toLowerCase() === 'haso'
            ? t(`${T_PATH}.confirmDialogHasoContent`)
            : t(`${T_PATH}.confirmDialogHitasContent`)}
        </Dialog.Content>
        <Dialog.ActionButtons>
          <Button variant="danger" type="submit" form={formId}>
            {t(`${T_PATH}.rejectOffer`)}
          </Button>
          <Button variant="secondary" onClick={() => closeConfirmDialog()}>
            {t(`${T_PATH}.cancel`)}
          </Button>
        </Dialog.ActionButtons>
      </Dialog>
    );
  };

  const renderOfferStatusNotification = (offerItem: ApartmentReservationOffer) => {
    const notificationText = `${renderOfferState(offerItem)} ${renderOfferDate(offerItem)}`;

    const getOfferStateNotification = () => {
      switch (offerItem.state) {
        case OfferState.PENDING:
          return (
            <Notification type="info" size="small">
              {notificationText}
            </Notification>
          );
        case OfferState.ACCEPTED:
          return (
            <Notification type="success" size="small">
              {notificationText}
            </Notification>
          );
        case OfferState.REJECTED:
          return (
            <Notification type="error" size="small">
              {notificationText}
            </Notification>
          );
      }
    };

    return (
      <div className={styles.offerStatus}>
        {offerItem.is_expired ? (
          <Notification type="error" size="small">
            {notificationText}
          </Notification>
        ) : (
          getOfferStateNotification()
        )}
      </div>
    );
  };

  const renderTable = () => (
    <table className={cx(styles.offerTable, 'hds-table hds-table--light')}>
      <thead className="hds-table__header-row">
        <tr>
          <th>{t(`${T_PATH}.apartment`)}</th>
          <th>
            <div className={styles.tooltipWrapper}>
              {t(`${T_PATH}.applicant`)}
              <Tooltip placement="top" small className={styles.tooltip}>
                {t(`${T_PATH}.basedOnCustomerData`)}
              </Tooltip>
            </div>
          </th>
          {project.ownership_type.toLowerCase() === 'haso' ? (
            <>
              <th>
                <div className={styles.tooltipWrapper}>
                  {t(`${T_PATH}.hasoNumber`)}
                  <Tooltip placement="top" small className={styles.tooltip}>
                    {t(`${T_PATH}.basedOnReservationData`)}
                  </Tooltip>
                </div>
              </th>
              <th>
                <div className={styles.tooltipWrapper}>
                  {t(`${T_PATH}.isOver55`)}
                  <Tooltip placement="top" small className={styles.tooltip}>
                    {t(`${T_PATH}.basedOnReservationData`)}
                  </Tooltip>
                </div>
              </th>
              <th>
                <div className={styles.tooltipWrapper}>
                  {t(`${T_PATH}.hasHasoOwnership`)}
                  <Tooltip placement="top" small className={styles.tooltip}>
                    {t(`${T_PATH}.basedOnReservationData`)}
                  </Tooltip>
                </div>
              </th>
            </>
          ) : (
            <>
              <th>
                <div className={styles.tooltipWrapper}>
                  {t(`${T_PATH}.familyWithChildren`)}
                  <Tooltip placement="top" small className={styles.tooltip}>
                    {t(`${T_PATH}.basedOnReservationData`)}
                  </Tooltip>
                </div>
              </th>
              <th>
                <div className={styles.tooltipWrapper}>
                  {t(`${T_PATH}.hasHitasOwnership`)}
                  <Tooltip placement="top" small className={styles.tooltip}>
                    {t(`${T_PATH}.basedOnReservationData`)}
                  </Tooltip>
                </div>
              </th>
            </>
          )}
        </tr>
      </thead>
      <tbody className="hds-table__content">
        <tr>
          <td>
            <span className={styles.emphasized}>{apartment.apartment_number}</span>
            <span>{apartment.apartment_structure}&nbsp;</span>
            <span className={styles.muted}>
              ({apartment.living_area ? formattedLivingArea(apartment.living_area) : '-'})
            </span>
          </td>
          <td>
            <div>
              {customer.primary_profile.last_name}, {customer.primary_profile.first_name}{' '}
              {customer.primary_profile.email && `\xa0 ${customer.primary_profile.email}`}
            </div>
            {customer.secondary_profile && (
              <div>
                {customer.secondary_profile.last_name}, {customer.secondary_profile.first_name}{' '}
                {customer.secondary_profile.email && `\xa0 ${customer.secondary_profile.email}`}
              </div>
            )}
          </td>
          {project.ownership_type.toLowerCase() === 'haso' ? (
            <>
              <td>{reservation.right_of_residence || '-'}</td>
              <td>{renderBooleanTextualValue(reservation.is_age_over_55)}</td>
              <td>{renderBooleanTextualValue(reservation.is_right_of_occupancy_housing_changer)}</td>
            </>
          ) : (
            <>
              <td>{renderBooleanTextualValue(reservation.has_children)}</td>
              <td>{renderBooleanTextualValue(reservation.has_hitas_ownership)}</td>
            </>
          )}
        </tr>
      </tbody>
    </table>
  );

  const renderError = () => (
    <Notification type="error" size="small" style={{ marginTop: 15 }}>
      {t(`${T_PATH}.errorLoadingOffer`)}
    </Notification>
  );

  const renderModalContent = () => (
    <>
      {!isNewOffer && offer && renderOfferStatusNotification(offer)}

      <div className={styles.projectDetails}>
        <ProjectName project={project} />
      </div>

      {renderTable()}

      <OfferForm
        formId={formId}
        handleFormCallback={handleFormCallback}
        offer={isNewOffer ? undefined : offer}
        ownershipType={project.ownership_type}
        reservationId={reservation.id}
      />

      <hr />
    </>
  );

  return (
    <>
      <Dialog
        id={`offer-dialog-${reservation.id}`}
        aria-labelledby="offer-dialog-header"
        isOpen={isOfferDialogOpen}
        close={closeOfferDialog}
        closeButtonLabelText={t(`${T_PATH}.closeDialog`)}
        className={styles.offerDialog}
      >
        <Dialog.Header id="offer-dialog-header" title={isNewOffer ? t(`${T_PATH}.newOffer`) : t(`${T_PATH}.offer`)} />
        <Dialog.Content>
          {isNewOffer ? (
            renderModalContent()
          ) : offerIsLoading ? (
            <Spinner />
          ) : offerIsError ? (
            renderError()
          ) : (
            renderModalContent()
          )}
        </Dialog.Content>
        {((!isNewOffer && offer) || isNewOffer) && (
          <Dialog.ActionButtons>
            <Button
              variant="primary"
              type="submit"
              form={formId}
              isLoading={isCreatingOffer || isUpdatingOffer}
              loadingText={t(`${T_PATH}.saving`)}
              ref={openConfirmDialogButtonRef}
            >
              {isNewOffer ? t(`${T_PATH}.setOfferAsSent`) : t(`${T_PATH}.saveOffer`)}
            </Button>
            <Button variant="secondary" onClick={() => closeOfferDialog()}>
              {t(`${T_PATH}.cancel`)}
            </Button>
          </Dialog.ActionButtons>
        )}
      </Dialog>
      {renderConfirmModal()}
    </>
  );
};

export default OfferModal;
