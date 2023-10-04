import { shallow } from 'enzyme';

import Reports from './Reports';

describe('Reports', () => {
  it('renders the component', () => {
    const wrapper = shallow(<Reports />);
    expect(wrapper.text()).toEqual('<Container /><SalesReport /><CostIndexOverview />');
  });
});
