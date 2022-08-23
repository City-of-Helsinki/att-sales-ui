import React from 'react';
import cx from 'classnames';
import { Link } from 'react-router-dom';
import { Button, IconAngleDown, IconAngleRight, IconBell, IconGroup, IconPlus } from 'hds-react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import ApartmentBaseDetails from './ApartmentBaseDetails';
import useSessionStorage from '../../utils/useSessionStorage';
import formatDateTime from '../../utils/formatDateTime';
import OfferStatusText from '../offer/OfferStatusText';
import { Apartment, ApartmentReservationCustomer, ApartmentReservationWithCustomer, Project } from '../../types';
import { ApartmentReservationStates, ROUTES } from '../../enums';
import { showOfferModal } from '../../redux/features/offerModalSlice';
import { showReservationAddModal } from '../../redux/features/reservationAddModalSlice';
import { showReservationCancelModal } from '../../redux/features/reservationCancelModalSlice';
import { showReservationEditModal } from '../../redux/features/reservationEditModalSlice';

import styles from './ApartmentRow.module.scss';

const T_PATH = 'components.apartment.ApartmentRow';

interface IProps {
  apartment: Apartment;
  ownershipType: Project['ownership_type'];
  isLotteryCompleted: boolean;
  project: Project;
}

const ApartmentRow = ({ apartment, ownershipType, isLotteryCompleted, project }: IProps): JSX.Element => {
  const { reservations, apartment_uuid } = apartment;
  const [applicationRowOpen, setApplicationRowOpen] = useSessionStorage({
    defaultValue: false,
    key: `applicationRowOpen-${apartment_uuid}`,
  });
  const [resultRowOpen, setResultRowOpen] = useSessionStorage({
    defaultValue: false,
    key: `resultRowOpen-${apartment_uuid}`,
  });
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const toggleApplicationRow = () => setApplicationRowOpen(!applicationRowOpen);
  const toggleResultRow = () => setResultRowOpen(!resultRowOpen);

  const isCanceled = (reservation: ApartmentReservationWithCustomer): boolean => {
    return reservation.state === ApartmentReservationStates.CANCELED;
  };

  const renderApplicants = (reservation: ApartmentReservationWithCustomer, isLotteryResult: boolean) => {
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
              {renderCustomerProfile(reservation.customer.primary_profile)}
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
          {renderNotificationIcon(reservation, isLotteryResult)}
        </div>
      );
    }
  };

  const renderHasoNumberOrFamilyIcon = (reservation: ApartmentReservationWithCustomer) => {
    if (ownershipType === 'haso') {
      return reservation.right_of_residence;
    }
    if (reservation.has_children) {
      return <IconGroup />;
    }
  };

  // Show bell icon for customers where the customer has multiple winning apartments/reservations
  // Ignore canceled reservations
  const renderNotificationIcon = (reservation: ApartmentReservationWithCustomer, isLotteryResult: boolean) => {
    if (!isCanceled(reservation) && isLotteryResult && reservation.has_multiple_winning_apartments) {
      return (
        <span className={cx(styles.bellIcon, resultRowOpen && styles.rowOpen)}>
          <span className={styles.tooltip}>{t(`${T_PATH}.hasMultipleWinningApartments`)}</span>
          <IconBell />
        </span>
      );
    }
  };

  const renderLotteryResults = () => {
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
          <div className={styles.cancellationReason}>
            {reservation.cancellation_reason &&
              t(`ENUMS.ReservationCancelReasons.${reservation.cancellation_reason.toUpperCase()}`)}{' '}
            {reservation.cancellation_timestamp && formatDateTime(reservation.cancellation_timestamp)}
          </div>
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
      // Find the applicant that is currently first in the reservation queue
      const firstInQueue = reservations.find((r) => r.queue_position === 1);

      // If there's no one in the queue or the reservation is canceled, show "add new reservation" button
      if (!firstInQueue || isCanceled(firstInQueue)) return addReservation();

      return (
        <>
          {renderApplicants(firstInQueue, true)}
          <div className={styles.rowActions}>
            <span>{renderHasoNumberOrFamilyIcon(firstInQueue)}</span>
            {renderActionButtons(firstInQueue, ownershipType, true)}
          </div>
        </>
      );
    };

    return (
      <div className={cx(styles.cell, styles.buttonCell, resultRowOpen && styles.open)}>
        <div className={cx(styles.firstResultRow, !resultRowOpen && styles.closed)}>
          <div className={cx(styles.firstResultRowApplicant, resultRowOpen && styles.open)}>{renderFirstInQueue()}</div>
          <button
            className={cx(styles.smallToggleButton, resultRowOpen && styles.open)}
            onClick={toggleResultRow}
            aria-controls={`apartment-row-${apartment_uuid}`}
            aria-expanded={resultRowOpen}
          >
            {resultRowOpen ? <IconAngleDown /> : <IconAngleRight />}
          </button>
        </div>
        <div
          className={resultRowOpen ? cx(styles.toggleContent, styles.open) : styles.toggleContent}
          id={`apartment-row-${apartment_uuid}`}
        >
          {!!reservations.length ? (
            <>
              {reservations.map((reservation) => (
                <div
                  className={cx(
                    styles.singleReservation,
                    styles.resultReservation,
                    isCanceled(reservation) && styles.disabledRow
                  )}
                  key={reservation.id}
                >
                  <div className={styles.singleReservationColumn}>{renderApplicants(reservation, true)}</div>
                  <div className={styles.singleReservationColumn}>
                    <div className={cx(styles.rowActions, resultRowOpen && styles.rowOpen)}>
                      <span>{renderHasoNumberOrFamilyIcon(reservation)}</span>
                      {renderActionButtons(reservation, ownershipType, reservation.queue_position === 1)}
                    </div>
                  </div>
                </div>
              ))}
              <div className={cx(styles.singleReservation, styles.resultReservation)}>{addReservation()}</div>
            </>
          ) : (
            addReservation()
          )}
        </div>
      </div>
    );
  };

  const renderReservations = () => {
    const noApplicants = !reservations || reservations.length === 0;

    const renderReservationCountText = () => {
      if (noApplicants) {
        return <span className={styles.textMuted}>{t(`${T_PATH}.noApplicants`)}</span>;
      }
      return <span>{t(`${T_PATH}.applicants`, { count: reservations.length })}</span>;
    };

    return (
      <div className={cx(styles.cell, styles.buttonCell, applicationRowOpen && styles.open)}>
        <button
          className={cx(styles.rowToggleButton, applicationRowOpen && styles.open, noApplicants && styles.noApplicants)}
          onClick={toggleApplicationRow}
          aria-controls={`apartment-row-${apartment_uuid}`}
          aria-expanded={!!reservations.length && applicationRowOpen ? true : false}
          disabled={noApplicants}
        >
          {renderReservationCountText()}
          {applicationRowOpen ? <IconAngleDown /> : <IconAngleRight />}
        </button>

        <div
          className={applicationRowOpen ? cx(styles.toggleContent, styles.open) : styles.toggleContent}
          id={`apartment-row-${apartment_uuid}`}
        >
          {!!reservations.length ? (
            reservations.map((reservation) => (
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
          showState={isLotteryCompleted ? resultRowOpen : false}
        />
      </div>
      {isLotteryCompleted ? renderLotteryResults() : renderReservations()}
    </div>
  );
};

export default ApartmentRow;
