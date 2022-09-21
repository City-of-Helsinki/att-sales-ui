import { CustomerReservation } from '../types';
import { groupReservationsByProject } from './mapReservationData';

const mockData = [
  {
    id: 1,
    project_uuid: 'bdb19b55-5cb8-4f36-816a-00000000000',
    project_housing_company: 'Asunto Oy Tuleva S',
    apartment_uuid: '48ba3236-464b-4f5d-8c2a-1bfb994a7571',
    apartment_number: 'B16',
    apartment_installments: [
      {
        type: 'PAYMENT_1',
        amount: 1370000,
        account_number: '123123123-1234',
        due_date: '2022-02-18',
        reference_number: 'REF-432423',
      },
    ],
    lottery_position: null,
    queue_position: 1,
    state: 'submitted',
  },
  {
    id: 2,
    project_uuid: 'bdb19b55-5cb8-4f36-816a-00000000000',
    project_housing_company: 'Asunto Oy Tuleva S',
    apartment_uuid: '48ba3236-464b-4f5d-8c2a-1bfb994a7572',
    apartment_number: 'A10',
    apartment_installments: null,
    lottery_position: null,
    queue_position: 1,
    state: 'submitted',
  },
  {
    id: 3,
    project_uuid: 'bdb19b55-5cb8-4f36-816a-111111111111',
    project_housing_company: 'Haso Vanha Mylly',
    apartment_uuid: '48ba3236-464b-4f5d-8c2a-1bfb994a7573',
    apartment_number: 'A1',
    apartment_installments: null,
    lottery_position: null,
    queue_position: 1,
    state: 'submitted',
  },
] as CustomerReservation[];

const targetData = [
  [
    {
      id: 1,
      apartment_uuid: '48ba3236-464b-4f5d-8c2a-1bfb994a7571',
      apartment_number: 'B16',
      apartment_installments: [
        {
          type: 'PAYMENT_1',
          amount: 1370000,
          account_number: '123123123-1234',
          due_date: '2022-02-18',
          reference_number: 'REF-432423',
        },
      ],
      lottery_position: null,
      project_uuid: 'bdb19b55-5cb8-4f36-816a-00000000000',
      project_housing_company: 'Asunto Oy Tuleva S',
      queue_position: 1,
      state: 'submitted',
    },
    {
      id: 2,
      apartment_uuid: '48ba3236-464b-4f5d-8c2a-1bfb994a7572',
      apartment_number: 'A10',
      apartment_installments: null,
      lottery_position: null,
      project_uuid: 'bdb19b55-5cb8-4f36-816a-00000000000',
      project_housing_company: 'Asunto Oy Tuleva S',
      queue_position: 1,
      state: 'submitted',
    },
  ],
  [
    {
      id: 3,
      apartment_uuid: '48ba3236-464b-4f5d-8c2a-1bfb994a7573',
      apartment_number: 'A1',
      apartment_installments: null,
      lottery_position: null,
      project_uuid: 'bdb19b55-5cb8-4f36-816a-111111111111',
      project_housing_company: 'Haso Vanha Mylly',
      queue_position: 1,
      state: 'submitted',
    },
  ],
];

describe('mapCustomerReservations', () => {
  it('maps data properly', () => {
    const mappedData = groupReservationsByProject(mockData);

    expect(mappedData).toMatchObject(targetData);
  });

  it('returns empty array if no reservations', () => {
    const mappedData = groupReservationsByProject([]);

    expect(mappedData).toMatchObject([]);
  });
});
