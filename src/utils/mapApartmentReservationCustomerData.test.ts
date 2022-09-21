import { mapApartmentReservationCustomerData } from './mapApartmentReservationCustomerData';

import mockCustomer from '../mocks/customer.json';
import { Customer } from '../types';

const customerWithTwoProfiles = mockCustomer as Customer;
const customerWithoutSecondaryProfile = { ...mockCustomer, secondary_profile: null } as Customer;

const targetDataWithSecondaryProfile = {
  id: customerWithTwoProfiles.id,
  primary_profile: {
    first_name: customerWithTwoProfiles.primary_profile.first_name,
    last_name: customerWithTwoProfiles.primary_profile.last_name,
    email: customerWithTwoProfiles.primary_profile.email,
  },
  secondary_profile: {
    first_name: customerWithTwoProfiles.secondary_profile?.first_name,
    last_name: customerWithTwoProfiles.secondary_profile?.last_name,
    email: customerWithTwoProfiles.secondary_profile?.email,
  },
};

const targetDataWithoutSecondaryProfile = {
  id: customerWithoutSecondaryProfile.id,
  primary_profile: {
    first_name: customerWithoutSecondaryProfile.primary_profile.first_name,
    last_name: customerWithoutSecondaryProfile.primary_profile.last_name,
    email: customerWithoutSecondaryProfile.primary_profile.email,
  },
  secondary_profile: undefined,
};

describe('mapOfferCustomerData', () => {
  it('maps data with secondary profile', () => {
    const mappedData = mapApartmentReservationCustomerData(customerWithTwoProfiles);

    expect(mappedData).toMatchObject(targetDataWithSecondaryProfile);
  });

  it('maps data without secondary profile', () => {
    const mappedData = mapApartmentReservationCustomerData(customerWithoutSecondaryProfile);

    expect(mappedData).toMatchObject(targetDataWithoutSecondaryProfile);
  });
});
