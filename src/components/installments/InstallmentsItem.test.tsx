import { rest } from 'msw';
import { screen } from '@testing-library/react';

import InstallmentsItem from './InstallmentsItem';
import { renderWithProviders } from '../../test/test-utils';
import { server } from '../../test/server';

const apartment = {
  uuid: '48ba3236-464b-4f5d-8c2a-1bfb994a7571',
  apartment_number: 'B16',
  apartment_structure: '1h+k+s',
  living_area: 29.0,
  debt_free_sales_price: 10000000,
  right_of_occupancy_payment: null,
  sales_price: 7500000,
};
const HitasProject = {
  uuid: 'bdb19b55-5cb8-4f36-816a-000000000000',
  housing_company: 'Asunto Oy Tuleva S',
  ownership_type: 'Hitas',
  street_address: 'Pellervontie 24',
  district: 'Käpylä',
};
const HasoProject = {
  uuid: 'bdb19b55-5cb8-4f36-816a-111111111111',
  housing_company: 'Haso Vanha Mylly',
  ownership_type: 'HASO',
  street_address: 'Yläkiventie 16',
  district: 'Myllypuro',
};
const reservationId = 1;

describe('InstallmentsItem', () => {
  it('handles good Hitas response', async () => {
    renderWithProviders(
      <InstallmentsItem project={HitasProject} apartment={apartment} reservationId={reservationId} />
    );

    screen.getByText('components.installments.InstallmentsItem.loading...');

    await screen.findAllByText('B16', { exact: false });
    await screen.findAllByText('1h+k+s', { exact: false });
    await screen.findAllByText('Myyntihinta');
    await screen.findAllByText('ENUMS.InstallmentTypes.PAYMENT_1');
    await screen.findAllByText('reference-1');
    await screen.findAllByText('Velaton hinta', { exact: false });
  });

  it('handles good HASO response', async () => {
    renderWithProviders(<InstallmentsItem project={HasoProject} apartment={apartment} reservationId={reservationId} />);

    screen.getByText('components.installments.InstallmentsItem.loading...');

    await screen.findAllByText('B16', { exact: false });
    await screen.findAllByText('1h+k+s', { exact: false });
    await screen.findAllByText('ENUMS.InstallmentTypes.PAYMENT_2');
    await screen.findAllByText('reference-2');
    await screen.findAllByText('AO-maksu');
  });

  it('renders edit installments button when there is installments', async () => {
    renderWithProviders(
      <InstallmentsItem project={HitasProject} apartment={apartment} reservationId={reservationId} />
    );

    screen.getByText('components.installments.InstallmentsItem.loading...');

    await screen.findAllByText('components.installments.InstallmentsItem.editInstallments');
  });

  it('handles response when reservation is undefined', async () => {
    // force msw to return empty apartment_reservation
    server.use(
      rest.get(`${process.env.REACT_APP_API_BASE_URL}/apartment_reservations/0`, (_req, res, ctx) => {
        return res(ctx.json(undefined));
      })
    );

    renderWithProviders(
      <InstallmentsItem project={HitasProject} apartment={apartment} reservationId={reservationId} />
    );

    screen.getByText('components.installments.InstallmentsItem.loading...');

    expect(screen.queryByText('components.installments.InstallmentsItem.salesPrice')).toBeNull();
  });

  it('handles error response', async () => {
    // force msw to return error response
    server.use(
      rest.get(`${process.env.REACT_APP_API_BASE_URL}/apartment_reservations/0`, (_req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    renderWithProviders(<InstallmentsItem project={HitasProject} apartment={apartment} reservationId={0} />);

    screen.getByText('components.installments.InstallmentsItem.loading...');

    await screen.findByText('components.installments.InstallmentsItem.errorLoadingInstallments');
  });
});
