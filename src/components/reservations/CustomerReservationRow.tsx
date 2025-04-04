import React, { useState, useRef } from 'react';
import cx from 'classnames';
import { Button, Dialog, IconInfoCircle, Tabs } from 'hds-react';
import { isEmpty } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import formatDateTime from '../../utils/formatDateTime';
import formattedLivingArea from '../../utils/formatLivingArea';
import Label from '../common/label/Label';
import OfferStatusText from '../offer/OfferStatusText';
import { ApartmentReservationStates } from '../../enums';
import { Customer, CustomerReservation, ReservationStateChangeUser } from '../../types';
import { mapApartmentReservationCustomerData } from '../../utils/mapApartmentReservationCustomerData';
import { getReservationApartmentData, getReservationProjectData } from '../../utils/mapReservationData';
import { renderBooleanTextualValue } from '../../utils/renderBooleanTextualValue';
import { showOfferModal } from '../../redux/features/offerModalSlice';
import { showReservationCancelModal } from '../../redux/features/reservationCancelModalSlice';
import { toast } from '../common/toast/ToastManager';
import { useDownloadFile } from '../../utils/useDownloadFile';
import { useFileDownloadApi } from '../../utils/useFileDownloadApi';

import styles from './CustomerReservationRow.module.scss';
import { getRightOfResidenceText } from '../../utils/getRightOfResidenceText';

const T_PATH = 'components.reservations.CustomerReservationRow';

interface IProps {
  customer: Customer;
  reservation: CustomerReservation;
}

const CustomerReservationRow = ({ customer, reservation }: IProps): JSX.Element => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [isLoadingContract, setIsLoadingContract] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const openDialogButtonRef = useRef(null);
  const apartment = getReservationApartmentData(reservation);
  const project = getReservationProjectData(reservation);
  const isOwnershipTypeHaso = reservation.project_ownership_type.toLowerCase() === 'haso';
  const isCanceled = reservation.state === ApartmentReservationStates.CANCELED;
  const isInReview = reservation.state === ApartmentReservationStates.REVIEW;
  const isWinningReservation = reservation.project_lottery_completed && reservation.queue_position === 1;
  const canCreateOffer = isWinningReservation;
  const canCreateContract = isWinningReservation && !isInReview;

  const closeDialog = () => setIsDialogOpen(false);

  const preContractDownloading = () => setIsLoadingContract(true);
  const postContractDownloading = () => setIsLoadingContract(false);

  const onContractLoadError = () => {
    setIsLoadingContract(false);
    toast.show({ type: 'error' });
  };

  const getContractFileName = (): string => {
    const projectName = reservation.project_housing_company;
    const apartmentNumber = reservation.apartment_number;
    let prefix = '';

    const slugify = (text: string): string => {
      return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9 ]/g, '')
        .replace(/\s+/g, '-');
    };

    if (isOwnershipTypeHaso) {
      prefix = 'sopimus';
    } else {
      prefix = 'kauppakirja';
    }

    // Example output: "kauppakirja_as-oy-project-x_a01_2022-01-01.pdf"

    return `${prefix}${slugify(projectName + ' ' + apartmentNumber)}-${new Date().toJSON().slice(0, 10)}.pdf`;
  };

  const contractApiUrl = `/apartment_reservations/${reservation.id}/contract/`;

  const {
    download,
    ref: fileRef,
    url: fileUrl,
    name: fileName,
  } = useDownloadFile({
    apiDefinition: useFileDownloadApi(contractApiUrl),
    getFileName: getContractFileName,
    onError: onContractLoadError,
    postDownloading: postContractDownloading,
    preDownloading: preContractDownloading,
  });

  const renderQueuePosition = (): JSX.Element | undefined => {
    if (!reservation.project_lottery_completed) {
      return <div>{t(`${T_PATH}.lotteryUncompleted`)}</div>;
    }
    return <div>{`${reservation.queue_position}. ` + t(`${T_PATH}.position`)}</div>;
  };

  const renderPriorityNumber = () => {
    if (reservation.priority_number !== undefined && reservation.priority_number !== null) {
      return reservation.priority_number;
    }
    return '-';
  };

  // Find the last state change event object with status of "canceled"
  const getLatestCancelStateEvent = (reservation: CustomerReservation) =>
    reservation.state_change_events
      ?.slice()
      .reverse()
      .find((stateChangeEvent) => stateChangeEvent.state === ApartmentReservationStates.CANCELED);

  const renderCancelDetails = (): JSX.Element => {
    const latestCancelStateEvent = getLatestCancelStateEvent(reservation);

    if (!latestCancelStateEvent || isEmpty(reservation.state_change_events)) {
      return <div className={styles.cancelText}>{t(`${T_PATH}.canceled`)}</div>;
    }

    const cancellationReasonText =
      t(`ENUMS.ReservationCancelReasons.${latestCancelStateEvent.cancellation_reason?.toUpperCase()}`) || '';

    return (
      <>
        <div className={cx(styles.cancelText, styles.noWrap)}>
          {t(`${T_PATH}.canceled`)}
          {latestCancelStateEvent.cancellation_reason && ` (${cancellationReasonText})`}
          {' - '}
          {latestCancelStateEvent.timestamp && formatDateTime(latestCancelStateEvent.timestamp)}
        </div>
        <div className={styles.cancelText}>{latestCancelStateEvent.comment}</div>
      </>
    );
  };

  const renderApartmentReservationState = () => {
    const stateText = t(`ENUMS.ApartmentReservationStates.${reservation.state.toUpperCase()}`);
    const waitingForLotteryText = t(`${T_PATH}.waitingForLottery`);

    if (!reservation.project_lottery_completed && reservation.state === ApartmentReservationStates.SUBMITTED) {
      return `${stateText} (${waitingForLotteryText})`;
    }

    return stateText;
  };

  const renderReservationDetailTable = () => {
    return (
      <table className={cx('hds-table hds-table--light', styles.reservationDetailTable)}>
        <tbody className="hds-table__content">
          <tr>
            <th>{t(`${T_PATH}.state`)}</th>
            <td>{isCanceled ? renderCancelDetails() : renderApartmentReservationState()}</td>
          </tr>
          <tr>
            <th>{t(`${T_PATH}.queuePosition`)}</th>
            <td>
              {reservation.project_lottery_completed && reservation.queue_position
                ? `${reservation.queue_position}.`
                : t(`${T_PATH}.noPositionNumber`)}
            </td>
          </tr>
          <tr>
            <th>{t(`${T_PATH}.submittedLate`)}</th>
            <td>{reservation.submitted_late && t(`${T_PATH}.yes`)}</td>
          </tr>
          <tr>
            <th>{t(`${T_PATH}.lotteryCompleted`)}</th>
            <td>{reservation.project_lottery_completed ? t(`${T_PATH}.yes`) : t(`${T_PATH}.no`)}</td>
          </tr>
          <tr>
            <th>{t(`${T_PATH}.lotteryPosition`)}</th>
            <td>
              {reservation.lottery_position ? `${reservation.lottery_position}.` : t(`${T_PATH}.noPositionNumber`)}
            </td>
          </tr>
          <tr>
            <th>
              {t(`${T_PATH}.priorityNumber`)}
              <span className={styles.asterisk}>&nbsp;*</span>
            </th>
            <td>{reservation.priority_number ? reservation.priority_number : '-'}</td>
          </tr>
          {isOwnershipTypeHaso ? (
            <>
              <tr>
                <th>
                  {t(`${T_PATH}.rightOfResidence`)}
                  <span className={styles.asterisk}>&nbsp;*</span>
                </th>
                <td>{getRightOfResidenceText(customer)}</td>
              </tr>
              <tr>
                <th>
                  {t(`${T_PATH}.isAgeOver55`)}
                  <span className={styles.asterisk}>&nbsp;*</span>
                </th>
                <td>{renderBooleanTextualValue(reservation.is_age_over_55)}</td>
              </tr>
              <tr>
                <th>
                  {t(`${T_PATH}.isRightOfOccupancyHousingChanger`)}
                  <span className={styles.asterisk}>&nbsp;*</span>
                </th>
                <td>{renderBooleanTextualValue(reservation.is_right_of_occupancy_housing_changer)}</td>
              </tr>
            </>
          ) : (
            <>
              <tr>
                <th>
                  {t(`${T_PATH}.hasChildren`)}
                  <span className={styles.asterisk}>&nbsp;*</span>
                </th>
                <td>{renderBooleanTextualValue(reservation.has_children)}</td>
              </tr>
              <tr>
                <th>
                  {t(`${T_PATH}.hasHitasOwnership`)}
                  <span className={styles.asterisk}>&nbsp;*</span>
                </th>
                <td>{renderBooleanTextualValue(reservation.has_hitas_ownership)}</td>
              </tr>
            </>
          )}
        </tbody>
      </table>
    );
  };

  const renderHistoryTable = () => {
    if (isEmpty(reservation.state_change_events)) {
      return <p>{t(`${T_PATH}.noChangeHistory`)}</p>;
    }

    const renderUserDetails = (user?: ReservationStateChangeUser | null) => {
      if (user) {
        return (
          <>
            {user.first_name} {user.last_name}
            {user.email && <span>&nbsp;&ndash;&nbsp;{user.email}</span>}
          </>
        );
      }
      return '-';
    };

    return (
      <table className={cx('hds-table hds-table--light', styles.historyTable)}>
        <thead>
          <tr className="hds-table__header-row">
            <th style={{ width: 0, paddingRight: 0 }}>#</th>
            <th>{t(`${T_PATH}.reservationState`)}</th>
            <th>{t(`${T_PATH}.timestamp`)}</th>
            <th>{t(`${T_PATH}.comment`)}</th>
            <th>{t(`${T_PATH}.user`)}</th>
          </tr>
        </thead>
        <tbody className="hds-table__content">
          {reservation.state_change_events?.map((stateChangeEvent, index) => (
            <tr key={index}>
              <td className={styles.noWrap} style={{ paddingRight: 0 }}>
                {index + 1}.
              </td>
              <td className={styles.noWrap}>
                {t(`ENUMS.ApartmentReservationStates.${stateChangeEvent.state.toUpperCase()}`)}
                {isCanceled && stateChangeEvent.cancellation_reason && (
                  <span>
                    &nbsp;({t(`ENUMS.ReservationCancelReasons.${stateChangeEvent.cancellation_reason.toUpperCase()}`)})
                  </span>
                )}
              </td>
              <td>{stateChangeEvent.timestamp && formatDateTime(stateChangeEvent.timestamp)}</td>
              <td>{stateChangeEvent.comment || '-'}</td>
              <td>{renderUserDetails(stateChangeEvent.changed_by)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className={styles.row}>
      <div className={cx(styles.apartmentRow, isCanceled && styles.disabledRow)}>
        <div className={styles.apartmentRowLeft}>
          <div className={styles.apartmentStructure}>
            <span className={styles.emphasized}>{apartment.apartment_number}</span>
            <span>
              {apartment.apartment_structure} ({formattedLivingArea(apartment.living_area)})
            </span>
          </div>
          {isCanceled ? (
            renderCancelDetails()
          ) : (
            <>
              {renderQueuePosition()}
              <div>
                {t(`${T_PATH}.priority`)}: {renderPriorityNumber()}
              </div>
              {isOwnershipTypeHaso && (
                <div>
                  {t(`${T_PATH}.hasoNumber`)}:{' ' + getRightOfResidenceText(customer)}{' '}
                  {reservation.submitted_late && '*'}
                </div>
              )}
            </>
          )}
        </div>
        <div className={styles.apartmentRowRight}>
          {reservation.offer && (
            <div className={styles.offer}>
              <OfferStatusText offer={reservation.offer} />
            </div>
          )}
          <div className={styles.infoBtn}>
            <span className={styles.tooltip} aria-hidden>
              {t(`${T_PATH}.showReservationInfo`)}
            </span>
            <Button
              variant="supplementary"
              size="small"
              iconLeft={<IconInfoCircle aria-hidden />}
              onClick={() => setIsDialogOpen(true)}
              ref={openDialogButtonRef}
            >
              <span className="visually-hidden">{t(`${T_PATH}.showReservationInfo`)}</span>
            </Button>
          </div>
        </div>
      </div>
      {!isCanceled && (
        <div className={styles.buttons}>
          <div>
            {canCreateOffer && (
              <Button
                variant="secondary"
                size="small"
                onClick={() =>
                  dispatch(
                    showOfferModal({
                      apartment: apartment,
                      customer: mapApartmentReservationCustomerData(customer),
                      isNewOffer: !reservation.offer,
                      project: project,
                      reservation: reservation,
                    })
                  )
                }
              >
                {t(`${T_PATH}.offer`)}
              </Button>
            )}
            {canCreateContract && (
              <>
                <Button variant="secondary" size="small" onClick={download} disabled={isLoadingContract}>
                  {isOwnershipTypeHaso ? t(`${T_PATH}.createContract`) : t(`${T_PATH}.createDeedOfSale`)}
                </Button>
                <a href={fileUrl} download={fileName} className="visually-hidden" ref={fileRef}>
                  {t(`${T_PATH}.download`)}
                </a>
              </>
            )}
          </div>
          <div>
            <Button
              variant="supplementary"
              size="small"
              iconLeft={''}
              className={styles.cancelBtn}
              onClick={() =>
                dispatch(
                  showReservationCancelModal({
                    ownershipType: project.ownership_type,
                    projectId: project.uuid,
                    reservationId: reservation.id,
                    customer: mapApartmentReservationCustomerData(customer),
                    apartmentId: reservation.apartment_uuid,
                  })
                )
              }
            >
              {t(`${T_PATH}.btnCancel`)}
            </Button>
          </div>
        </div>
      )}
      <Dialog
        id={`reservation-dialog-${reservation.id}`}
        aria-labelledby="reservation-dialog-header"
        isOpen={isDialogOpen}
        close={closeDialog}
        closeButtonLabelText={t(`${T_PATH}.closeDialog`)}
        className={styles.reservationDialog}
        focusAfterCloseRef={openDialogButtonRef}
      >
        <Dialog.Header id="reservation-dialog-header" title={t(`${T_PATH}.reservationInfo`)} />
        <Dialog.Content>
          <div className={styles.dialogTitle}>
            <Label type={project.ownership_type}>{project.ownership_type}</Label>
            <span>{project.housing_company}</span>
            <span>&ndash;</span>
            <span>{apartment.apartment_number}</span>
          </div>
          <Tabs>
            <Tabs.TabList className={styles.tabList}>
              <Tabs.Tab>{t(`${T_PATH}.reservationDetails`)}</Tabs.Tab>
              <Tabs.Tab>
                {t(`${T_PATH}.changeHistory`)} ({reservation.state_change_events?.length})
              </Tabs.Tab>
            </Tabs.TabList>
            <Tabs.TabPanel className={styles.tabPanel}>
              {renderReservationDetailTable()}
              <p className={styles.tableHelpText}>*&nbsp;{t(`${T_PATH}.tableHelpText`)}</p>
            </Tabs.TabPanel>
            <Tabs.TabPanel className={styles.tabPanel}>{renderHistoryTable()}</Tabs.TabPanel>
          </Tabs>
        </Dialog.Content>
        <Dialog.ActionButtons>
          <Button variant="secondary" onClick={() => closeDialog()}>
            {t(`${T_PATH}.close`)}
          </Button>
        </Dialog.ActionButtons>
      </Dialog>
    </div>
  );
};

export default CustomerReservationRow;
