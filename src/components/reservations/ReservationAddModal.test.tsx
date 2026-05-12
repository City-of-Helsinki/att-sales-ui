import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';

import { ApartmentReservationStates } from '../../enums';
import { showReservationAddModal } from '../../redux/features/reservationAddModalSlice';
import { Apartment, Project } from '../../types';
import { renderReservationAddModalOpened } from '../../test/reservationModalTestUtils';

const T = 'components.reservations.ReservationAddModal';

const clickSelectCustomer = () => fireEvent.click(screen.getByRole('button', { name: 'select-customer' }));
const clickAddButton = () => fireEvent.click(screen.getByRole('button', { name: `${T}.addBtn` }));
const getQueuePositionInput = () => screen.getByRole('spinbutton', { name: `${T}.queuePosition` });
const findQueuePositionInput = () => screen.findByRole('spinbutton', { name: `${T}.queuePosition` });
const getLateCheckbox = () => screen.getByRole('checkbox', { name: `${T}.submittedLate` });

const submitAndWaitForPreview = async () => {
  clickAddButton();
  await waitFor(() => {
    expect(mockPreviewMutation).toHaveBeenCalledTimes(1);
  });
};

const selectCustomerAndPreview = async () => {
  clickSelectCustomer();
  await submitAndWaitForPreview();
};

const mockPreviewMutation = jest.fn();
const mockCreateMutation = jest.fn();
let mockCurrentReservations: any = [];

const mockSelectCustomerDropdownProps = jest.fn();

jest.mock('../customers/SelectCustomerDropdown', () => {
  return function MockSelectCustomerDropdown(props: {
    handleSelectCallback: (customerId: string) => void;
    ownershipType?: string;
    isOpen?: boolean;
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

    clickSelectCustomer();
    fireEvent.change(screen.getByLabelText(`${T}.queuePosition`), { target: { value: '1' } });
    await submitAndWaitForPreview();

    expect(mockCreateMutation).not.toHaveBeenCalled();
  });

  it('creates reservation after preview confirmation', async () => {
    renderReservationAddModalOpened({ apartment, project });

    await selectCustomerAndPreview();
    fireEvent.click(screen.getByRole('button', { name: `${T}.confirm` }));

    await waitFor(() => {
      expect(mockCreateMutation).toHaveBeenCalledTimes(1);
    });
  });

  it('can reject add preview without creating reservation', async () => {
    renderReservationAddModalOpened({ apartment, project });

    await selectCustomerAndPreview();

    expect(screen.getByText(`${T}.previewTitle`)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: `${T}.reject` }));

    expect(screen.queryByRole('button', { name: `${T}.confirm` })).toBeNull();
    expect(mockCreateMutation).not.toHaveBeenCalled();
  });

  it('sends submitted_late=true to the preview when the late application checkbox is toggled on', async () => {
    renderReservationAddModalOpened({ apartment, project });

    clickSelectCustomer();

    const lateCheckbox = getLateCheckbox();
    expect(lateCheckbox).not.toBeChecked();
    fireEvent.click(lateCheckbox);
    expect(lateCheckbox).toBeChecked();

    await submitAndWaitForPreview();

    expect(mockPreviewMutation).toHaveBeenCalledWith(
      expect.objectContaining({
        formData: expect.objectContaining({ submitted_late: true }),
      })
    );
  });

  it('defaults submitted_late to false in the preview payload', async () => {
    renderReservationAddModalOpened({ apartment, project });

    await selectCustomerAndPreview();

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

    const queuePositionInput = await findQueuePositionInput();
    await waitFor(() => {
      expect(queuePositionInput).toHaveValue(4);
    });

    await selectCustomerAndPreview();

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

    const queuePositionInput = await findQueuePositionInput();
    await waitFor(() => {
      expect(queuePositionInput).toHaveValue(11);
    });
  });

  it('suggests queue position 1 when the queue is empty', async () => {
    mockCurrentReservations = [];

    renderReservationAddModalOpened({ apartment, project });

    const queuePositionInput = await findQueuePositionInput();
    await waitFor(() => {
      expect(queuePositionInput).toHaveValue(1);
    });

    await selectCustomerAndPreview();

    expect(mockPreviewMutation).toHaveBeenCalledWith(
      expect.objectContaining({
        formData: expect.objectContaining({ queue_position: 1 }),
      })
    );
  });

  it('renders preview rows with old → new position diffs and highlights the new applicant', async () => {
    mockCurrentReservations = [
      {
        id: 1,
        queue_position: 1,
        state: ApartmentReservationStates.RESERVED,
        customer: { primary_profile: { first_name: 'Foo', last_name: 'Foo' } },
      },
      {
        id: 2,
        queue_position: 2,
        state: ApartmentReservationStates.RESERVED,
        customer: { primary_profile: { first_name: 'Bar', last_name: 'Bar' } },
      },
    ];
    mockPreviewMutation.mockReturnValue({
      unwrap: () =>
        Promise.resolve([
          {
            id: null,
            queue_position: 1,
            state: ApartmentReservationStates.RESERVED,
            customer: { primary_profile: { first_name: 'New', last_name: 'Applicant' } },
          },
          {
            id: 1,
            queue_position: 2,
            state: ApartmentReservationStates.RESERVED,
            customer: { primary_profile: { first_name: 'Foo', last_name: 'Foo' } },
          },
          {
            id: 2,
            queue_position: 3,
            state: ApartmentReservationStates.RESERVED,
            customer: { primary_profile: { first_name: 'Bar', last_name: 'Bar' } },
          },
        ]),
    });

    renderReservationAddModalOpened({ apartment, project });

    await selectCustomerAndPreview();

    expect(screen.getByText(`${T}.previewAdded`)).toBeInTheDocument();

    const newApplicantRow = screen.getByTestId('preview-row-new');
    expect(within(newApplicantRow).getByText(/Applicant New/)).toBeInTheDocument();
    expect(newApplicantRow.textContent).toContain('1.');

    const fooRow = screen.getByTestId('preview-row-1');
    expect(within(fooRow).getByText(/Foo Foo/)).toBeInTheDocument();
    expect(fooRow.textContent).toContain('1');
    expect(fooRow.textContent).toContain('2');

    const barRow = screen.getByTestId('preview-row-2');
    expect(within(barRow).getByText(/Bar Bar/)).toBeInTheDocument();
    expect(barRow.textContent).toContain('2');
    expect(barRow.textContent).toContain('3');
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

  it('keeps the customer dropdown closed while the preview is active', async () => {
    renderReservationAddModalOpened({ apartment, project });

    expect(mockSelectCustomerDropdownProps).toHaveBeenLastCalledWith(expect.objectContaining({ isOpen: true }));

    await selectCustomerAndPreview();

    expect(mockSelectCustomerDropdownProps).toHaveBeenLastCalledWith(expect.objectContaining({ isOpen: false }));

    fireEvent.click(screen.getByRole('button', { name: `${T}.reject` }));

    expect(mockSelectCustomerDropdownProps).toHaveBeenLastCalledWith(expect.objectContaining({ isOpen: true }));
  });

  it('resets form state when the close (X) button is pressed and the modal is reopened', async () => {
    mockCurrentReservations = [];

    const { store } = renderReservationAddModalOpened({ apartment, project });

    clickSelectCustomer();

    const lateCheckbox = getLateCheckbox();
    fireEvent.click(lateCheckbox);
    expect(lateCheckbox).toBeChecked();

    await submitAndWaitForPreview();
    expect(screen.getByText(`${T}.previewTitle`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: `${T}.closeDialog` }));

    await waitFor(() => {
      expect(screen.queryByRole('checkbox', { name: `${T}.submittedLate` })).toBeNull();
    });

    act(() => {
      store.dispatch(showReservationAddModal({ apartment, project }));
    });

    expect(screen.queryByText(`${T}.previewTitle`)).toBeNull();
    expect(screen.queryByRole('button', { name: `${T}.confirm` })).toBeNull();

    expect(getLateCheckbox()).not.toBeChecked();
    expect(getQueuePositionInput()).toHaveValue(1);

    mockPreviewMutation.mockClear();
    await selectCustomerAndPreview();
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

    const queuePositionInput = await findQueuePositionInput();
    await waitFor(() => {
      expect(queuePositionInput).toHaveValue(11);
    });

    fireEvent.change(queuePositionInput, { target: { value: '2' } });
    await selectCustomerAndPreview();

    expect(mockPreviewMutation).toHaveBeenCalledWith(
      expect.objectContaining({
        formData: expect.objectContaining({ queue_position: 2 }),
      })
    );
  });
});
