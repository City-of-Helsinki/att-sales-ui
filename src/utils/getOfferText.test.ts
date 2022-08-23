import { ApartmentReservationOffer } from '../types';
import { renderOfferState, renderOfferDate } from './getOfferText';

const accepted: ApartmentReservationOffer = {
  id: 0,
  created_at: '2019-08-24T14:15:22Z',
  valid_until: '2019-09-24',
  state: 'accepted',
  concluded_at: '2019-10-24T14:15:22Z',
  comment: 'comment',
  is_expired: false,
};

const rejected: ApartmentReservationOffer = {
  id: 0,
  created_at: '2019-08-24T14:15:22Z',
  valid_until: '2019-09-24',
  state: 'rejected',
  concluded_at: '2019-10-24T14:15:22Z',
  comment: 'comment',
  is_expired: false,
};

const pending: ApartmentReservationOffer = {
  id: 0,
  created_at: '2019-08-24T14:15:22Z',
  valid_until: '2019-09-24',
  state: 'pending',
  concluded_at: '',
  comment: 'comment',
  is_expired: false,
};

const expired: ApartmentReservationOffer = {
  id: 0,
  created_at: '2019-08-24T14:15:22Z',
  valid_until: '2019-09-24',
  state: 'pending',
  concluded_at: '',
  comment: 'comment',
  is_expired: true,
};

describe('getOfferText', () => {
  it('should render correctly for pending', () => {
    const stateText = renderOfferState(pending);
    const stateTime = renderOfferDate(pending);
    expect(stateText).toEqual('Tarjous voimassa');
    expect(stateTime).toEqual('24.9.2019');
  });

  it('should render correctly for rejected', () => {
    const stateText = renderOfferState(rejected);
    const stateTime = renderOfferDate(rejected);
    expect(stateText).toEqual('Tarjous hylätty');
    expect(stateTime).toEqual('24.10.2019 klo 17.15');
  });

  it('should render correctly for accepted', () => {
    const stateText = renderOfferState(accepted);
    const stateTime = renderOfferDate(accepted);
    expect(stateText).toEqual('Tarjous hyväksytty');
    expect(stateTime).toEqual('24.10.2019 klo 17.15');
  });

  it('should render correctly for expired', () => {
    const stateText = renderOfferState(expired);
    const stateTime = renderOfferDate(expired);
    expect(stateText).toEqual('Tarjous vanhentunut');
    expect(stateTime).toEqual('24.9.2019');
  });
});
