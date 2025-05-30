import React, { useEffect, useState } from 'react';
import cx from 'classnames';
import { Link } from 'react-router-dom';
import {
  Button,
  IconAngleDown,
  IconAngleRight,
  IconBell,
  IconGroup,
  IconPlus,
  LoadingSpinner,
  Notification,
} from 'hds-react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import ApartmentBaseDetails from './ApartmentBaseDetails';
import { ApartmentReservationStates, ReservationCancelReasons, ROUTES } from '../../enums';
import formatDateTime from '../../utils/formatDateTime';
import OfferStatusText from '../offer/OfferStatusText';
import {
  Apartment,
  ApartmentReservationCustomer,
  ApartmentReservationWithCustomer,
  Project,
  WinningReservation,
} from '../../types';
import ReservationRevaluationInfo from '../revaluation/ReservationRevaluationInfo';
import { showOfferModal } from '../../redux/features/offerModalSlice';
import { showReservationAddModal } from '../../redux/features/reservationAddModalSlice';
import { showReservationCancelModal } from '../../redux/features/reservationCancelModalSlice';
import { showReservationEditModal } from '../../redux/features/reservationEditModalSlice';
import {
  useGetApartmentReservationsQuery,
  useSetApartmentReservationToOfferedMutation,
} from '../../redux/services/api';
import { getRightOfResidenceText } from '../../utils/getRightOfResidenceText';

import styles from './ApartmentRow.module.scss';

const T_PATH = 'components.apartment.ApartmentRow';

interface IProps {
  apartment: Apartment;
  ownershipType: Project['ownership_type'];
  isLotteryCompleted: boolean;
  project: Project;
}

const ApartmentRow = ({ apartment, ownershipType, isLotteryCompleted, project }: IProps): JSX.Element => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [applicationRowOpen, setApplicationRowOpen] = useState(false);
  const [resultRowOpen, setResultRowOpen] = useState(false);
  const { apartment_uuid, reservation_count, winning_reservation } = apartment;
  const {
    data: reservations,
    isSuccess,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useGetApartmentReservationsQuery(apartment_uuid, {
    skip: (!isLotteryCompleted && !applicationRowOpen) || (isLotteryCompleted && !resultRowOpen),
  });

  const hasReservations: boolean = reservation_count > 0 || !!reservations?.length;

  const toggleApplicationRow = () => setApplicationRowOpen(!applicationRowOpen);
  const toggleResultRow = () => setResultRowOpen(!resultRowOpen);

  const isCanceled = (reservation: ApartmentReservationWithCustomer): boolean => {
    return reservation.state === ApartmentReservationStates.CANCELED;
  };
  const { data: reservationsQueue } = useGetApartmentReservationsQuery(apartment.apartment_uuid);
  const [setApartmentReservationToOffered] = useSetApartmentReservationToOfferedMutation();
  const [sortedReservations, setSortedReservations] = useState<ApartmentReservationWithCustomer[]>([]);

  const handleRestore = async (reservationId: number, projectId: string, apartmentId: string) => {
    if (!reservationsQueue) {
      console.error('Reservations queue is not available.');
      return;
    }
    const reservation = reservationsQueue?.find((res) => res.id === reservationId);

    if (!reservation) {
      console.error('Failed to find reservation.');
      return;
    }

    let queuePosition;

    if (reservation.queue_position_before_cancelation) {
      queuePosition = reservation.queue_position_before_cancelation;
    } else if (reservation.lottery_position) {
      queuePosition = reservation.lottery_position;
    } else if (reservation.queue_position) {
      queuePosition = reservation.queue_position;
    } else {
      const maxQueuePosition = Math.max(...reservationsQueue.map((res) => res.queue_position || 0));
      queuePosition = maxQueuePosition + 1;
    }

    try {
      await setApartmentReservationToOffered({
        reservationId,
        projectId,
        apartmentId,
        queuePosition,
      }).unwrap();
      await refetch();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (reservationsQueue) {
      const sorted = [...reservationsQueue].sort((a, b) => (a.queue_position || 0) - (b.queue_position || 0));
      setSortedReservations(sorted);
    }
  }, [reservationsQueue]);

  const renderApplicants = (
    reservation: ApartmentReservationWithCustomer | WinningReservation,
    isLotteryResult: boolean,
    hasMultipleWinningApartments?: boolean
  ) => {
    if (reservation.customer) {
      const renderPositionNumber = () => {
        if (isCanceled(reservation)) {
          if (reservation.lottery_position) {
            return `00${reservation.lottery_position}`;
          } else {
            return '-';
          }
        }
        return `${reservation.queue_position}.`;
      };

      const renderCustomerProfile = (
        profile: ApartmentReservationCustomer['primary_profile' | 'secondary_profile']
      ) => {
        return (
          <>
            {profile?.last_name}, {profile?.first_name} {isLotteryResult && profile?.email && `\xa0 ${profile.email}`}
          </>
        );
      };

      return (
        <div className={cx(styles.customer, isLotteryResult && styles.isLottery)}>
          <Link to={`/${ROUTES.CUSTOMERS}/${reservation.customer.id}`} className={styles.customerLink}>
            <div className={styles.user}>
              {isLotteryResult && <span className={styles.queueNumberSpacer}>{renderPositionNumber()}</span>}
              {renderCustomerProfile(reservation.customer.primary_profile)} {reservation.submitted_late && '*'}
            </div>
            {reservation.customer.secondary_profile && (
              <div className={styles.user}>
                {isLotteryResult && <span className={styles.queueNumberSpacer} />}
                {renderCustomerProfile(reservation.customer.secondary_profile)}
              </div>
            )}
            {isLotteryResult && reservation.offer && (
              <div>
                <span className={styles.queueNumberSpacer} />
                <span className={styles.offer}>
                  <OfferStatusText offer={reservation.offer} />
                </span>
              </div>
            )}
          </Link>
          {hasMultipleWinningApartments && renderNotificationIcon()}
        </div>
      );
    }
  };

  const renderHasoNumberOrFamilyIcon = (reservation: ApartmentReservationWithCustomer) => {
    if (ownershipType === 'haso') {
      return getRightOfResidenceText(reservation);
    }
    if (reservation.has_children) {
      return <IconGroup />;
    }
  };

  // Show bell icon for customers where the customer has multiple winning apartments/reservations
  const renderNotificationIcon = () => (
    <span className={cx(styles.bellIcon, resultRowOpen && !isLoading && styles.rowOpen)}>
      <span className={styles.tooltip}>{t(`${T_PATH}.hasMultipleWinningApartments`)}</span>
      <IconBell />
    </span>
  );

  const renderToggleButtonIcon = (isOpen: boolean) => {
    if (isLoading || isFetching) {
      return <LoadingSpinner small />;
    }
    return isOpen ? <IconAngleDown /> : <IconAngleRight />;
  };

  const renderLotteryResults = () => {
    const isRowOpen: boolean = resultRowOpen && !isLoading && (isSuccess || isError);

    const addReservation = () => (
      <div className={styles.addNewReservationButton}>
        <Button
          size="small"
          variant="supplementary"
          iconLeft={<IconPlus size="xs" />}
          onClick={() =>
            dispatch(
              showReservationAddModal({
                project: project,
                apartment: apartment,
              })
            )
          }
        >
          {t(`${T_PATH}.btnAddApplicant`)}
        </Button>
      </div>
    );

    const renderActionButtons = (
      reservation: ApartmentReservationWithCustomer,
      projectOwnershipType: Project['ownership_type'],
      showAllButtons: boolean
    ) => (
      <div className={styles.actionButtons}>
        {isCanceled(reservation) ? (
          <>
            <div className={styles.cancellationReason}>
              {reservation.cancellation_reason
                ? t(`ENUMS.ReservationCancelReasons.${reservation.cancellation_reason.toUpperCase()}`)
                : t(`${T_PATH}.canceled`)}{' '}
              {reservation.cancellation_timestamp && formatDateTime(reservation.cancellation_timestamp)}
              <Button
                variant="supplementary"
                size="small"
                iconLeft={''}
                disabled={false}
                onClick={() => handleRestore(reservation.id, project.uuid, apartment.apartment_uuid)}
              >
                {t(`${T_PATH}.btnReturn`)}
              </Button>
            </div>
            {projectOwnershipType.toLowerCase() === 'haso' &&
              reservation.cancellation_reason === ReservationCancelReasons.TERMINATED && (
                <ReservationRevaluationInfo reservationWithCustomer={reservation} />
              )}
          </>
        ) : (
          <>
            <Button
              variant="supplementary"
              size="small"
              iconLeft={''}
              onClick={() =>
                dispatch(
                  showReservationCancelModal({
                    ownershipType: projectOwnershipType,
                    projectId: project.uuid,
                    reservationId: reservation.id,
                    customer: reservation.customer,
                    apartmentId: reservation.apartment_uuid,
                  })
                )
              }
            >
              {t(`${T_PATH}.btnCancel`)}
            </Button>
            {showAllButtons && (
              <>
                <Button
                  variant="supplementary"
                  size="small"
                  iconLeft={''}
                  onClick={() =>
                    dispatch(
                      showReservationEditModal({
                        reservation: reservation,
                        projectId: project.uuid,
                        apartmentId: reservation.apartment_uuid,
                      })
                    )
                  }
                >
                  {t(`${T_PATH}.btnEdit`)}
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() =>
                    dispatch(
                      showOfferModal({
                        apartment: apartment,
                        customer: reservation.customer,
                        isNewOffer: !reservation.offer,
                        project: project,
                        reservation: reservation,
                      })
                    )
                  }
                >
                  {t(`${T_PATH}.btnOffer`)}
                </Button>
              </>
            )}
          </>
        )}
      </div>
    );

    const renderFirstInQueue = () => {
      // If there's no one in the queue, show "add new reservation" button
      if (!winning_reservation) return addReservation();

      return (
        <>
          {renderApplicants(winning_reservation, true, winning_reservation.has_multiple_winning_apartments)}
          <div className={styles.rowActions}>
            <span>{renderHasoNumberOrFamilyIcon(winning_reservation)}</span>
            {renderActionButtons(winning_reservation, ownershipType, true)}
          </div>
        </>
      );
    };

    const renderSingleReservation = (reservation: ApartmentReservationWithCustomer) => {
      const isFirstInQueue = reservation.queue_position === 1;

      const hasMultipleWinningApartments = (): boolean => {
        if (winning_reservation && isFirstInQueue) {
          return winning_reservation.has_multiple_winning_apartments;
        }
        return false;
      };

      return (
        <div
          className={cx(
            styles.singleReservation,
            styles.resultReservation,
            isCanceled(reservation) && styles.disabledRow,
            isFetching && styles.isFetching
          )}
          key={reservation.id}
        >
          <div className={styles.singleReservationColumn}>
            {renderApplicants(reservation, true, hasMultipleWinningApartments())}
          </div>
          <div className={styles.singleReservationColumnSecond}>
            <div className={cx(styles.rowActions, isRowOpen && styles.rowOpen)}>
              <span>{renderHasoNumberOrFamilyIcon(reservation)}</span>
              {renderActionButtons(reservation, ownershipType, isFirstInQueue)}
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className={cx(styles.cell, styles.buttonCell)}>
        <div className={cx(styles.firstResultRow, !isRowOpen && styles.closed)}>
          <div className={cx(styles.firstResultRowApplicant, isRowOpen && styles.open)}>{renderFirstInQueue()}</div>
          <button
            className={cx(styles.smallToggleButton, isRowOpen && styles.open)}
            onClick={toggleResultRow}
            aria-controls={`apartment-row-${apartment_uuid}`}
            aria-expanded={isRowOpen}
            disabled={isLoading || isFetching}
          >
            {renderToggleButtonIcon(resultRowOpen)}
          </button>
        </div>
        <div className={cx(styles.toggleContent, isRowOpen && styles.open)} id={`apartment-row-${apartment_uuid}`}>
          {isError && (
            <div className={styles.reservationLoadError}>
              <Notification
                size="small"
                type="error"
                label={t(`${T_PATH}.errorWhileLoadingReservationsLabel`)}
                position="inline"
              >
                {t(`${T_PATH}.errorWhileLoadingReservations`)}&nbsp;
                <button onClick={refetch}>{t(`${T_PATH}.tryToReload`)}</button>
              </Notification>
            </div>
          )}
          {hasReservations ? (
            <>
              {isSuccess && sortedReservations?.map((reservation) => renderSingleReservation(reservation))}
              <div className={cx(styles.singleReservation, styles.resultReservation)}>{addReservation()}</div>
            </>
          ) : (
            <>
              {isSuccess && (
                <div className={styles.noReservations}>
                  <span className={styles.queueNumberSpacer} />
                  {t(`${T_PATH}.noReservations`)}
                </div>
              )}
              {addReservation()}
            </>
          )}
        </div>
      </div>
    );
  };

  const renderReservations = () => {
    const isRowOpen: boolean = applicationRowOpen && !isLoading && (isSuccess || isError);

    const renderReservationCountText = () => {
      if (!hasReservations) {
        return <span className={styles.textMuted}>{t(`${T_PATH}.noApplicants`)}</span>;
      }
      return <span>{t(`${T_PATH}.applicants`, { count: reservation_count })}</span>;
    };

    return (
      <div className={cx(styles.cell, styles.buttonCell)}>
        <button
          className={cx(styles.rowToggleButton, isRowOpen && styles.open, !hasReservations && styles.noApplicants)}
          onClick={toggleApplicationRow}
          aria-controls={`apartment-row-${apartment_uuid}`}
          aria-expanded={hasReservations && isRowOpen ? true : false}
          disabled={!hasReservations || isLoading}
        >
          {renderReservationCountText()}
          {renderToggleButtonIcon(applicationRowOpen)}
        </button>

        <div className={cx(styles.toggleContent, isRowOpen && styles.open)} id={`apartment-row-${apartment_uuid}`}>
          {hasReservations ? (
            reservations
              ?.filter((reservation) => !isCanceled(reservation))
              .map((reservation) => (
                <div className={styles.singleReservation} key={reservation.id}>
                  <div className={styles.singleReservationColumn}>{renderApplicants(reservation, false)}</div>
                  <div className={styles.singleReservationColumn}>{renderHasoNumberOrFamilyIcon(reservation)}</div>
                </div>
              ))
          ) : (
            <div className={styles.singleReservation}>
              <span className={styles.textMuted}>{t(`${T_PATH}.noApplicants`)}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.apartmentTableRow}>
      <div className={cx(styles.cell, styles.apartmentCell)}>
        <ApartmentBaseDetails
          apartment={apartment}
          isLotteryResult={isLotteryCompleted}
          showState={isLotteryCompleted ? resultRowOpen && !isLoading && (isSuccess || isError) : false}
        />
      </div>
      {isLotteryCompleted ? renderLotteryResults() : renderReservations()}
    </div>
  );
};

export default ApartmentRow;
