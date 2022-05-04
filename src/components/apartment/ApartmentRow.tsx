import React from 'react';
import cx from 'classnames';
import { Link } from 'react-router-dom';
import { Button, IconAngleDown, IconAngleRight, IconBell, IconGroup, IconPlus } from 'hds-react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import ApartmentBaseDetails from './ApartmentBaseDetails';
import useSessionStorage from '../../utils/useSessionStorage';
import formatDateTime from '../../utils/formatDateTime';
import sortReservationApplicants from '../../utils/sortReservationApplicants';
import { Apartment, ApartmentReservationWithCustomer, Project } from '../../types';
import { ApartmentReservationStates, ROUTES } from '../../enums';
import { showReservationAddModal } from '../../redux/features/reservationAddModalSlice';
import { showReservationCancelModal } from '../../redux/features/reservationCancelModalSlice';
import { showReservationEditModal } from '../../redux/features/reservationEditModalSlice';

import styles from './ApartmentRow.module.scss';

const T_PATH = 'components.apartment.ApartmentRow';

interface IProps {
  apartment: Apartment;
  ownershipType: Project['ownership_type'];
  lotteryCompleted: Project['lottery_completed'];
  project: Project;
}

const ApartmentRow = ({ apartment, ownershipType, lotteryCompleted, project }: IProps): JSX.Element => {
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
    // TODO: Remove 'reservation.state' when API gets updated
    return (
      reservation.current_state?.value === ApartmentReservationStates.CANCELED ||
      reservation.state === ApartmentReservationStates.CANCELED
    );
  };

  const renderApplicants = (reservation: ApartmentReservationWithCustomer, isLotteryResult: boolean) => {
    if (reservation.applicants) {
      const sortedApplicants = sortReservationApplicants(reservation.applicants);

      const renderOfferInfo = () => {
        return <span className={styles.offer}>TODO: Offers</span>;
      };

      return (
        <div className={cx(styles.customer, isLotteryResult && styles.isLottery)}>
          <Link to={`/${ROUTES.CUSTOMERS}/${reservation.customer || 0}`} className={styles.customerLink}>
            {sortedApplicants.map((applicant, index) => (
              <div key={index}>
                {isLotteryResult && (
                  <span className={styles.queueNumberSpacer}>
                    {index === 0 &&
                      (isCanceled(reservation) ? `00${reservation.list_position}` : `${reservation.queue_position}.`)}
                  </span>
                )}
                {applicant.last_name}, {applicant.first_name}{' '}
                {isLotteryResult && applicant.email && `\xa0 ${applicant.email}`}
              </div>
            ))}
            {isLotteryResult && reservation.offer_info && (
              <div>
                <span className={styles.queueNumberSpacer} />
                {renderOfferInfo()}
              </div>
            )}
          </Link>
          {isLotteryResult && renderReviewNotification(reservation)}
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

  const renderReviewNotification = (reservation: ApartmentReservationWithCustomer) => {
    // TODO: Remove 'reservation.state' when API gets updated
    if (
      reservation.current_state?.value === ApartmentReservationStates.REVIEW ||
      reservation.state === ApartmentReservationStates.REVIEW
    ) {
      return (
        <span className={cx(styles.bellIcon, resultRowOpen && styles.rowOpen)}>
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
            {reservation.cancellation_info?.cancellation_reason}{' '}
            {reservation.cancellation_info?.date ? formatDateTime(reservation.cancellation_info.date, true) : '-'}
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
                    reservation: reservation,
                    ownershipType: projectOwnershipType,
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
                <Button variant="secondary" size="small">
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
          isLotteryResult={lotteryCompleted}
          showState={lotteryCompleted ? resultRowOpen : false}
        />
      </div>
      {lotteryCompleted ? renderLotteryResults() : renderReservations()}
    </div>
  );
};

export default ApartmentRow;
