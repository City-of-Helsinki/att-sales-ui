import { fireEvent, screen, waitFor } from '@testing-library/react';

import ReservationEditModal from './ReservationEditModal';
import { renderWithProviders } from '../../test/test-utils';
import { ApartmentReservationStates } from '../../enums';
import { ApartmentReservationWithCustomer, Project } from '../../types';

const mockPreviewMutation = jest.fn();
const mockSetStateMutation = jest.fn();
const mockCurrentReservations = [{ id: 123, queue_position: 2 }];

jest.mock('../../redux/services/api', () => {
  const actual = jest.requireActual('../../redux/services/api');
  return {
    ...actual,
    useGetApartmentReservationsQuery: () => ({ data: mockCurrentReservations }),
    usePreviewApartmentQueueChangeMutation: () => [mockPreviewMutation, { isLoading: false }],
    useSetApartmentReservationStateMutation: () => [mockSetStateMutation, { isLoading: false }],
  };
});

const reservation: ApartmentReservationWithCustomer = {
  id: 123,
  apartment_uuid: 'apartment-1',
  state: ApartmentReservationStates.RESERVED,
  submitted_late: false,
  queue_position: 2,
  revaluation: null,
  customer: {
    id: 10,
    primary_profile: { first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' },
    secondary_profile: null,
  },
  has_children: false,
  right_of_residence: 123456,
  right_of_residence_is_old_batch: false,
  has_hitas_ownership: false,
  is_age_over_55: false,
  is_right_of_occupancy_housing_changer: false,
};

const project = { uuid: 'project-1' } as Project;

describe('ReservationEditModal preview flow', () => {
  beforeEach(() => {
    mockPreviewMutation.mockReset();
    mockSetStateMutation.mockReset();

    mockPreviewMutation.mockReturnValue({
      unwrap: () => Promise.resolve([{ ...reservation, queue_position: 1 }]),
    });
    mockSetStateMutation.mockReturnValue({
      unwrap: () => Promise.resolve({}),
    });
  });

  it('previews changes before persisting state update', async () => {
    renderWithProviders(<ReservationEditModal />, {
      preloadedState: {
        tokens: { apiToken: 'test-token' },
        reservationEditModal: {
          isOpened: true,
          content: {
            reservation,
            projectId: project.uuid,
            apartmentId: reservation.apartment_uuid,
          },
        },
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'components.reservations.ReservationEditModal.edit' }));

    await waitFor(() => {
      expect(mockPreviewMutation).toHaveBeenCalledTimes(1);
    });
    expect(mockSetStateMutation).not.toHaveBeenCalled();
  });

  it('persists state update after preview confirmation', async () => {
    renderWithProviders(<ReservationEditModal />, {
      preloadedState: {
        tokens: { apiToken: 'test-token' },
        reservationEditModal: {
          isOpened: true,
          content: {
            reservation,
            projectId: project.uuid,
            apartmentId: reservation.apartment_uuid,
          },
        },
      },
    });

    const editButton = screen.getByRole('button', { name: 'components.reservations.ReservationEditModal.edit' });
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(mockPreviewMutation).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('button', { name: 'components.reservations.ReservationEditModal.confirm' }));

    await waitFor(() => {
      expect(mockSetStateMutation).toHaveBeenCalledTimes(1);
    });
  });

  it('can update preview without persisting changes', async () => {
    renderWithProviders(<ReservationEditModal />, {
      preloadedState: {
        tokens: { apiToken: 'test-token' },
        reservationEditModal: {
          isOpened: true,
          content: {
            reservation,
            projectId: project.uuid,
            apartmentId: reservation.apartment_uuid,
          },
        },
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'components.reservations.ReservationEditModal.edit' }));

    await waitFor(() => {
      expect(mockPreviewMutation).toHaveBeenCalledTimes(1);
    });

    expect(screen.getAllByText('Doe Jane').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'components.reservations.ReservationEditModal.reject' }));

    await waitFor(() => {
      expect(mockPreviewMutation).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByRole('button', { name: 'components.reservations.ReservationEditModal.confirm' })).toBeDefined();
    expect(mockSetStateMutation).not.toHaveBeenCalled();
  });
});
