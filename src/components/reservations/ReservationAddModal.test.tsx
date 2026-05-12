import { act, fireEvent, screen, waitFor } from '@testing-library/react';

import ReservationAddModal from './ReservationAddModal';
import { ApartmentReservationStates } from '../../enums';
import { showReservationAddModal } from '../../redux/features/reservationAddModalSlice';
import { Apartment, Project } from '../../types';
import { renderReservationAddModalOpened } from '../../test/reservationModalTestUtils';

const mockPreviewMutation = jest.fn();
const mockCreateMutation = jest.fn();
let mockCurrentReservations: any = [];

const mockSelectCustomerDropdownProps = jest.fn();

jest.mock('../customers/SelectCustomerDropdown', () => {
  return function MockSelectCustomerDropdown(props: {
    handleSelectCallback: (customerId: string) => void;
    ownershipType?: string;
  }) {
    mockSelectCustomerDropdownProps(props);
    return (
      <button type="button" onClick={() => props.handleSelectCallback('10')}>
        select-customer
      </button>
    );
  };
});

jest.mock('../../redux/services/api', () => {
  const actual = jest.requireActual('../../redux/services/api');
  return {
    ...actual,
    useGetApartmentReservationsQuery: () => ({ data: mockCurrentReservations }),
    usePreviewApartmentQueueChangeMutation: () => [mockPreviewMutation, { isLoading: false }],
    useCreateApartmentReservationMutation: () => [mockCreateMutation, { isLoading: false }],
  };
});

const apartment = {
  apartment_uuid: 'apartment-1',
  apartment_number: 'A1',
  apartment_structure: '2h+kt',
  living_area: 47,
} as Apartment;

const project = {
  uuid: 'project-1',
  ownership_type: 'haso',
  housing_company: 'Housing Company',
  district: 'District',
  street_address: 'Street 1',
} as Project;

describe('ReservationAddModal preview flow', () => {
  beforeEach(() => {
    mockPreviewMutation.mockReset();
    mockCreateMutation.mockReset();
    mockSelectCustomerDropdownProps.mockReset();
    mockCurrentReservations = [];

    mockPreviewMutation.mockReturnValue({
      unwrap: () =>
        Promise.resolve([
          {
            id: 99,
            queue_position: 1,
            customer: {
              primary_profile: { first_name: 'Preview', last_name: 'Customer' },
            },
          },
        ]),
    });
    mockCreateMutation.mockReturnValue({
      unwrap: () => Promise.resolve({}),
    });
  });

  it('previews add before persisting reservation', async () => {
    renderReservationAddModalOpened({ apartment, project });

    fireEvent.click(screen.getByRole('button', { name: 'select-customer' }));
    fireEvent.change(screen.getByLabelText('components.reservations.ReservationAddModal.queuePosition'), {
      target: { value: '1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'components.reservations.ReservationAddModal.addBtn' }));

    await waitFor(() => {
      expect(mockPreviewMutation).toHaveBeenCalledTimes(1);
    });
    expect(mockCreateMutation).not.toHaveBeenCalled();
  });

  it('creates reservation after preview confirmation', async () => {
    renderReservationAddModalOpened({ apartment, project });

    fireEvent.click(screen.getByRole('button', { name: 'select-customer' }));
    fireEvent.click(screen.getByRole('button', { name: 'components.reservations.ReservationAddModal.addBtn' }));

    await waitFor(() => {
      expect(mockPreviewMutation).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('button', { name: 'components.reservations.ReservationAddModal.confirm' }));

    await waitFor(() => {
      expect(mockCreateMutation).toHaveBeenCalledTimes(1);
    });
  });

  it('can reject add preview without creating reservation', async () => {
    renderReservationAddModalOpened({ apartment, project });

    fireEvent.click(screen.getByRole('button', { name: 'select-customer' }));
    fireEvent.click(screen.getByRole('button', { name: 'components.reservations.ReservationAddModal.addBtn' }));

    await waitFor(() => {
      expect(mockPreviewMutation).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('components.reservations.ReservationAddModal.previewTitle')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'components.reservations.ReservationAddModal.reject' }));

    expect(screen.queryByRole('button', { name: 'components.reservations.ReservationAddModal.confirm' })).toBeNull();
    expect(mockCreateMutation).not.toHaveBeenCalled();
  });

  it('sends submitted_late=true to the preview when the late application checkbox is toggled on', async () => {
    renderReservationAddModalOpened({ apartment, project });

    fireEvent.click(screen.getByRole('button', { name: 'select-customer' }));

    const lateCheckbox = screen.getByRole('checkbox', {
      name: 'components.reservations.ReservationAddModal.submittedLate',
    });
    expect(lateCheckbox).not.toBeChecked();

    fireEvent.click(lateCheckbox);
    expect(lateCheckbox).toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: 'components.reservations.ReservationAddModal.addBtn' }));

    await waitFor(() => {
      expect(mockPreviewMutation).toHaveBeenCalledTimes(1);
    });

    expect(mockPreviewMutation).toHaveBeenCalledWith(
      expect.objectContaining({
        formData: expect.objectContaining({ submitted_late: true }),
      })
    );
  });

  it('defaults submitted_late to false in the preview payload', async () => {
    renderReservationAddModalOpened({ apartment, project });

    fireEvent.click(screen.getByRole('button', { name: 'select-customer' }));
    fireEvent.click(screen.getByRole('button', { name: 'components.reservations.ReservationAddModal.addBtn' }));

    await waitFor(() => {
      expect(mockPreviewMutation).toHaveBeenCalledTimes(1);
    });

    expect(mockPreviewMutation).toHaveBeenCalledWith(
      expect.objectContaining({
        formData: expect.objectContaining({ submitted_late: false }),
      })
    );
  });

  it('suggests max existing queue position plus one when the queue is non-empty', async () => {
    mockCurrentReservations = [
      { id: 1, queue_position: 1, state: ApartmentReservationStates.RESERVED },
      { id: 2, queue_position: 2, state: ApartmentReservationStates.RESERVED },
      { id: 3, queue_position: 3, state: ApartmentReservationStates.RESERVED },
      { id: 4, queue_position: null, state: ApartmentReservationStates.CANCELED },
    ];

    renderReservationAddModalOpened({ apartment, project });

    const queuePositionInput = await screen.findByRole('spinbutton', {
      name: 'components.reservations.ReservationAddModal.queuePosition',
    });
    await waitFor(() => {
      expect(queuePositionInput).toHaveValue(4);
    });

    fireEvent.click(screen.getByRole('button', { name: 'select-customer' }));
    fireEvent.click(screen.getByRole('button', { name: 'components.reservations.ReservationAddModal.addBtn' }));

    await waitFor(() => {
      expect(mockPreviewMutation).toHaveBeenCalledTimes(1);
    });

    expect(mockPreviewMutation).toHaveBeenCalledWith(
      expect.objectContaining({
        formData: expect.objectContaining({ queue_position: 4 }),
      })
    );
  });

  it('suggests max queue plus one when positions have gaps (not length plus one)', async () => {
    mockCurrentReservations = [
      { id: 1, queue_position: 1, state: ApartmentReservationStates.RESERVED },
      { id: 2, queue_position: 10, state: ApartmentReservationStates.RESERVED },
    ];

    renderReservationAddModalOpened({ apartment, project });

    const queuePositionInput = await screen.findByRole('spinbutton', {
      name: 'components.reservations.ReservationAddModal.queuePosition',
    });
    await waitFor(() => {
      expect(queuePositionInput).toHaveValue(11);
    });
  });

  it('suggests queue position 1 when the queue is empty', async () => {
    mockCurrentReservations = [];

    renderReservationAddModalOpened({ apartment, project });

    const queuePositionInput = await screen.findByRole('spinbutton', {
      name: 'components.reservations.ReservationAddModal.queuePosition',
    });
    await waitFor(() => {
      expect(queuePositionInput).toHaveValue(1);
    });

    fireEvent.click(screen.getByRole('button', { name: 'select-customer' }));
    fireEvent.click(screen.getByRole('button', { name: 'components.reservations.ReservationAddModal.addBtn' }));

    await waitFor(() => {
      expect(mockPreviewMutation).toHaveBeenCalledTimes(1);
    });

    expect(mockPreviewMutation).toHaveBeenCalledWith(
      expect.objectContaining({
        formData: expect.objectContaining({ queue_position: 1 }),
      })
    );
  });

  it('forwards the project ownership type to the customer dropdown so HASO filtering can apply', () => {
    renderReservationAddModalOpened({ apartment, project });

    expect(mockSelectCustomerDropdownProps).toHaveBeenCalledWith(expect.objectContaining({ ownershipType: 'haso' }));
  });

  it('forwards a hitas ownership type to the customer dropdown without filtering', () => {
    const hitasProject = { ...project, ownership_type: 'hitas' } as Project;
    renderReservationAddModalOpened({ apartment, project: hitasProject });

    expect(mockSelectCustomerDropdownProps).toHaveBeenCalledWith(expect.objectContaining({ ownershipType: 'hitas' }));
  });

  it('resets form state when the close (X) button is pressed and the modal is reopened', async () => {
    mockCurrentReservations = [];

    const { store } = renderReservationAddModalOpened({ apartment, project });

    fireEvent.click(screen.getByRole('button', { name: 'select-customer' }));

    const lateCheckbox = screen.getByRole('checkbox', {
      name: 'components.reservations.ReservationAddModal.submittedLate',
    });
    fireEvent.click(lateCheckbox);
    expect(lateCheckbox).toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: 'components.reservations.ReservationAddModal.addBtn' }));

    await waitFor(() => {
      expect(mockPreviewMutation).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText('components.reservations.ReservationAddModal.previewTitle')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'components.reservations.ReservationAddModal.closeDialog' }));

    await waitFor(() => {
      expect(
        screen.queryByRole('checkbox', { name: 'components.reservations.ReservationAddModal.submittedLate' })
      ).toBeNull();
    });

    act(() => {
      store.dispatch(showReservationAddModal({ apartment, project }));
    });

    expect(screen.queryByText('components.reservations.ReservationAddModal.previewTitle')).toBeNull();
    expect(screen.queryByRole('button', { name: 'components.reservations.ReservationAddModal.confirm' })).toBeNull();

    const reopenedLateCheckbox = screen.getByRole('checkbox', {
      name: 'components.reservations.ReservationAddModal.submittedLate',
    });
    expect(reopenedLateCheckbox).not.toBeChecked();

    const reopenedQueueInput = screen.getByRole('spinbutton', {
      name: 'components.reservations.ReservationAddModal.queuePosition',
    });
    expect(reopenedQueueInput).toHaveValue(1);

    mockPreviewMutation.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'select-customer' }));
    fireEvent.click(screen.getByRole('button', { name: 'components.reservations.ReservationAddModal.addBtn' }));

    await waitFor(() => {
      expect(mockPreviewMutation).toHaveBeenCalledTimes(1);
    });
    expect(mockPreviewMutation).toHaveBeenCalledWith(
      expect.objectContaining({
        formData: expect.objectContaining({ submitted_late: false }),
      })
    );
  });

  it('lets the user override the suggested queue position', async () => {
    mockCurrentReservations = [
      { id: 1, queue_position: 1, state: ApartmentReservationStates.RESERVED },
      { id: 2, queue_position: 10, state: ApartmentReservationStates.RESERVED },
    ];

    renderReservationAddModalOpened({ apartment, project });

    const queuePositionInput = await screen.findByRole('spinbutton', {
      name: 'components.reservations.ReservationAddModal.queuePosition',
    });
    await waitFor(() => {
      expect(queuePositionInput).toHaveValue(11);
    });

    fireEvent.change(queuePositionInput, { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'select-customer' }));
    fireEvent.click(screen.getByRole('button', { name: 'components.reservations.ReservationAddModal.addBtn' }));

    await waitFor(() => {
      expect(mockPreviewMutation).toHaveBeenCalledTimes(1);
    });

    expect(mockPreviewMutation).toHaveBeenCalledWith(
      expect.objectContaining({
        formData: expect.objectContaining({ queue_position: 2 }),
      })
    );
  });
});
