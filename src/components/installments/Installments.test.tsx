import { shallow } from 'enzyme';
import { render, screen } from '@testing-library/react';

import ProjectName from '../../components/project/ProjectName';
import Installments from './Installments';
import mockCustomer from '../../mocks/customer.json';
import { CustomerReservation } from '../../types';

const reservations = (mockCustomer as any).apartment_reservations as CustomerReservation[];

describe('Installments', () => {
  it('renders the component', () => {
    const wrapper = shallow(<Installments reservations={reservations} />);
    expect(wrapper.find(ProjectName)).toHaveLength(2);
  });

  it('renders empty reservations message', () => {
    render(<Installments reservations={[]} />);
    expect(screen.getByText('components.installments.Installments.noReservations')).toBeDefined();
  });
});
