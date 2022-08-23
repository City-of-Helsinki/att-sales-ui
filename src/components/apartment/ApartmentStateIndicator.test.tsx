import { shallow } from 'enzyme';

import ApartmentStateIndicator from './ApartmentStateIndicator';
import { ApartmentState } from '../../enums';

describe('ApartmentStateIndicator', () => {
  it('renders green dot for ACCEPTED_BY_MUNICIPALITY', () => {
    const wrapper = shallow(<ApartmentStateIndicator state={ApartmentState.ACCEPTED_BY_MUNICIPALITY} />);
    expect(wrapper.find('.greenDot').length).toBe(1);
  });

  it('renders green dot for OFFER_ACCEPTED', () => {
    const wrapper = shallow(<ApartmentStateIndicator state={ApartmentState.OFFER_ACCEPTED} />);
    expect(wrapper.find('.greenDot').length).toBe(1);
  });

  it('renders green dot for RESERVATION_AGREEMENT', () => {
    const wrapper = shallow(<ApartmentStateIndicator state={ApartmentState.RESERVATION_AGREEMENT} />);
    expect(wrapper.find('.greenDot').length).toBe(1);
  });

  it('renders blue dot for FREE', () => {
    const wrapper = shallow(<ApartmentStateIndicator state={ApartmentState.FREE} />);
    expect(wrapper.find('.blueDot').length).toBe(1);
  });

  it('renders orange dot for OFFERED', () => {
    const wrapper = shallow(<ApartmentStateIndicator state={ApartmentState.OFFERED} />);
    expect(wrapper.find('.orangeDot').length).toBe(1);
  });

  it('renders red alert icon for OFFER_EXPIRED', () => {
    const wrapper = shallow(<ApartmentStateIndicator state={ApartmentState.OFFER_EXPIRED} />);
    expect(wrapper.find('.redIcon').length).toBe(1);
  });

  it('renders red alert icon for REVIEW', () => {
    const wrapper = shallow(<ApartmentStateIndicator state={ApartmentState.REVIEW} />);
    expect(wrapper.find('.redIcon').length).toBe(1);
  });

  it('renders orange alert icon for RESERVED', () => {
    const wrapper = shallow(<ApartmentStateIndicator state={ApartmentState.RESERVED} />);
    expect(wrapper.find('.orangeIcon').length).toBe(1);
  });

  it('renders green check icon for SOLD', () => {
    const wrapper = shallow(<ApartmentStateIndicator state={ApartmentState.SOLD} />);
    expect(wrapper.find('.greenIcon').length).toBe(1);
  });
});
