import React from 'react';
import { IconArrowRight, IconSize } from 'hds-react';

import { ApartmentReservationStates } from '../../enums';
import { ApartmentReservationWithCustomer } from '../../types';

import styles from './ReservationModal.module.scss';

interface ReservationQueuePreviewProps {
  // Heading shown above the queue list (e.g. "Jonon esikatselu").
  title: string;
  // Rows to display. May be the preview response or a fallback to the current
  // queue so the layout stays stable while the user is still editing.
  rows: ApartmentReservationWithCustomer[];
  // Used to look up each row's "old" queue position by id so position changes
  // can be rendered as a `{old} → {new}` diff.
  currentReservations: ApartmentReservationWithCustomer[];
  // Returns true for the row that should get the highlighted ("being edited"
  // / "being added") visual treatment, e.g. the new applicant in the add
  // modal or the reservation currently being edited.
  isHighlightedRow?: (row: ApartmentReservationWithCustomer) => boolean;
  // Optional label rendered next to the highlighted row's customer name.
  highlightedTag?: string;
  // When false, the "row position changed" background style is suppressed
  // (used by the edit modal before the user has confirmed they want to
  // commit the change).
  applyChangedRowStyle?: boolean;
  // When provided, each row gets a stable `data-testid` of the form
  // `${prefix}-${id ?? 'new'}` so tests can target rows reliably.
  rowTestIdPrefix?: string;
}

const ReservationQueuePreview = ({
  title,
  rows,
  currentReservations,
  isHighlightedRow,
  highlightedTag,
  applyChangedRowStyle = true,
  rowTestIdPrefix,
}: ReservationQueuePreviewProps): JSX.Element => {
  const currentPositionsById = new Map(currentReservations.map((current) => [current.id, current.queue_position]));
  // Sales users optimize active queue order; hiding canceled rows reduces noise
  // and makes actual position changes easier to validate quickly.
  const activeRows = rows
    .filter((row) => row.state !== ApartmentReservationStates.CANCELED)
    .sort((a, b) => (a.queue_position || 0) - (b.queue_position || 0));

  return (
    <div className={styles.editDialogPreviewColumn}>
      <strong>{title}</strong>
      <div className={styles.previewSectionColumn}>
        {activeRows.map((row) => {
          const oldPosition = currentPositionsById.get(row.id);
          const newPosition = row.queue_position;
          const positionsKnown =
            oldPosition !== undefined && oldPosition !== null && newPosition !== undefined && newPosition !== null;
          const showDiff = positionsKnown && oldPosition !== newPosition;
          const isChanged = applyChangedRowStyle && showDiff;
          const isHighlighted = isHighlightedRow ? isHighlightedRow(row) : false;
          const rowClassNames = [
            styles.previewRow,
            isChanged ? styles.previewRowChanged : '',
            isHighlighted ? styles.previewRowEdited : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <div
              key={`${row.id ?? 'new'}-${newPosition ?? 'x'}`}
              data-testid={rowTestIdPrefix ? `${rowTestIdPrefix}-${row.id ?? 'new'}` : undefined}
              className={rowClassNames}
            >
              <span className={styles.previewRowPosition}>
                {showDiff ? (
                  <span className={styles.previewPositionDiff}>
                    <span>{oldPosition}</span>
                    <IconArrowRight size={IconSize.ExtraSmall} aria-hidden />
                    <span>{newPosition}</span>
                  </span>
                ) : (
                  `${newPosition}.`
                )}
              </span>
              <span className={styles.previewRowName}>
                {row.customer?.primary_profile?.last_name ?? ''} {row.customer?.primary_profile?.first_name ?? ''}
                {isHighlighted && highlightedTag && <span className={styles.previewEditedTag}> {highlightedTag}</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReservationQueuePreview;
