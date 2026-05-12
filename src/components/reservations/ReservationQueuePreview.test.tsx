import { screen, within } from '@testing-library/react';

import ReservationQueuePreview from './ReservationQueuePreview';
import { ApartmentReservationStates } from '../../enums';
import { ApartmentReservationWithCustomer } from '../../types';
import { renderWithProviders } from '../../test/test-utils';

// `id` is widened to `number | null` here so tests can simulate a brand-new
// reservation that has not yet been persisted (the preview API returns the
// soon-to-be-added row without an id).
type PreviewRowOverrides = Omit<Partial<ApartmentReservationWithCustomer>, 'id' | 'queue_position'> & {
  id: number | null;
  queue_position: number | null;
};

const makeRow = (partial: PreviewRowOverrides): ApartmentReservationWithCustomer =>
  ({
    state: ApartmentReservationStates.RESERVED,
    customer: {
      primary_profile: { first_name: 'First', last_name: 'Last' },
    },
    ...partial,
  } as unknown as ApartmentReservationWithCustomer);

describe('ReservationQueuePreview', () => {
  it('renders rows sorted ascending by queue_position and hides canceled rows', () => {
    const rows = [
      makeRow({
        id: 2,
        queue_position: 2,
        customer: { primary_profile: { first_name: 'B', last_name: 'B' } } as any,
      }),
      makeRow({
        id: 99,
        queue_position: null,
        state: ApartmentReservationStates.CANCELED,
        customer: { primary_profile: { first_name: 'Gone', last_name: 'Gone' } } as any,
      }),
      makeRow({
        id: 1,
        queue_position: 1,
        customer: { primary_profile: { first_name: 'A', last_name: 'A' } } as any,
      }),
    ];

    renderWithProviders(
      <ReservationQueuePreview title="Preview" rows={rows} currentReservations={rows} rowTestIdPrefix="row" />
    );

    expect(screen.queryByText(/Gone Gone/)).toBeNull();
    const renderedRows = screen.getAllByTestId(/^row-/);
    expect(renderedRows).toHaveLength(2);
    expect(renderedRows[0]).toHaveAttribute('data-testid', 'row-1');
    expect(renderedRows[1]).toHaveAttribute('data-testid', 'row-2');
  });

  it('shows old → new diff for rows whose position changed and a plain "{n}." for unchanged rows', () => {
    const currentReservations = [makeRow({ id: 1, queue_position: 1 }), makeRow({ id: 2, queue_position: 2 })];
    const rows = [
      makeRow({
        id: 1,
        queue_position: 2,
        customer: { primary_profile: { first_name: 'Shifted', last_name: 'Down' } } as any,
      }),
      makeRow({
        id: 2,
        queue_position: 3,
        customer: { primary_profile: { first_name: 'Also', last_name: 'Shifted' } } as any,
      }),
      makeRow({
        id: null,
        queue_position: 1,
        customer: { primary_profile: { first_name: 'New', last_name: 'Applicant' } } as any,
      }),
    ];

    renderWithProviders(
      <ReservationQueuePreview
        title="Preview"
        rows={rows}
        currentReservations={currentReservations}
        rowTestIdPrefix="row"
        isHighlightedRow={(row) => row.id === null || row.id === undefined}
        highlightedTag="Added"
      />
    );

    const newRow = screen.getByTestId('row-new');
    expect(within(newRow).getByText(/Applicant New/)).toBeInTheDocument();
    expect(newRow.textContent).toContain('1.');

    const shiftedRow = screen.getByTestId('row-1');
    expect(shiftedRow.textContent).toContain('1');
    expect(shiftedRow.textContent).toContain('2');
  });

  it('renders the highlightedTag next to the highlighted row only', () => {
    const rows = [
      makeRow({
        id: 1,
        queue_position: 1,
        customer: { primary_profile: { first_name: 'Plain', last_name: 'Row' } } as any,
      }),
      makeRow({
        id: 2,
        queue_position: 2,
        customer: { primary_profile: { first_name: 'High', last_name: 'Light' } } as any,
      }),
    ];

    renderWithProviders(
      <ReservationQueuePreview
        title="Preview"
        rows={rows}
        currentReservations={rows}
        rowTestIdPrefix="row"
        isHighlightedRow={(row) => row.id === 2}
        highlightedTag="Editing"
      />
    );

    const highlightedRow = screen.getByTestId('row-2');
    expect(within(highlightedRow).getByText('Editing')).toBeInTheDocument();

    const plainRow = screen.getByTestId('row-1');
    expect(within(plainRow).queryByText('Editing')).toBeNull();
  });

  it('omits the "changed" background style when applyChangedRowStyle is false', () => {
    const currentReservations = [makeRow({ id: 1, queue_position: 1 })];
    const rows = [
      makeRow({
        id: 1,
        queue_position: 2,
        customer: { primary_profile: { first_name: 'Foo', last_name: 'Foo' } } as any,
      }),
    ];

    renderWithProviders(
      <ReservationQueuePreview
        title="Preview"
        rows={rows}
        currentReservations={currentReservations}
        rowTestIdPrefix="row"
        applyChangedRowStyle={false}
      />
    );

    const row = screen.getByTestId('row-1');
    expect(row.className).not.toMatch(/previewRowChanged/);
    // Position diff is still rendered visually so users see the new order.
    expect(row.textContent).toContain('1');
    expect(row.textContent).toContain('2');
  });
});
