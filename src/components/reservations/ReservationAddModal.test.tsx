import { fireEvent, screen, waitFor } from '@testing-library/react';

import ReservationAddModal from './ReservationAddModal';
import { renderWithProviders } from '../../test/test-utils';
import { Apartment, Project } from '../../types';

const mockPreviewMutation = jest.fn();
const mockCreateMutation = jest.fn();

jest.mock('../customers/SelectCustomerDropdown', () => {
  return function MockSelectCustomerDropdown({
    handleSelectCallback,
  }: {
    handleSelectCallback: (customerId: string) => void;
  }) {
    return (
      <button type="button" onClick={() => handleSelectCallback('10')}>
        select-customer
      </button>
    );
  };
});

jest.mock('../../redux/services/api', () => {
  const actual = jest.requireActual('../../redux/services/api');
  return {
    ...actual,
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
    renderWithProviders(<ReservationAddModal />, {
      preloadedState: {
        tokens: { apiToken: 'test-token' },
        reservationAddModal: {
          isOpened: true,
          content: { apartment, project },
        },
      },
    });

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
    renderWithProviders(<ReservationAddModal />, {
      preloadedState: {
        tokens: { apiToken: 'test-token' },
        reservationAddModal: {
          isOpened: true,
          content: { apartment, project },
        },
      },
    });

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
    renderWithProviders(<ReservationAddModal />, {
      preloadedState: {
        tokens: { apiToken: 'test-token' },
        reservationAddModal: {
          isOpened: true,
          content: { apartment, project },
        },
      },
    });

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
});
