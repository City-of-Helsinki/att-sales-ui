import { getProjectState } from './getProjectState';
import { StateOfSale } from '../enums';

describe('getProjectState', () => {
  it('should render correctly', () => {
    const project = {
      state_of_sale: StateOfSale.ForSale,
      published: true,
      archived: false,
    };
    const input = getProjectState(project);

    expect(input).toEqual('Myynnissä');
  });

  it('should render unpublished correctly', () => {
    const project = {
      state_of_sale: StateOfSale.Upcoming,
      published: false,
    };
    const input = getProjectState(project);

    expect(input).toEqual('Tuleva (Julkaisematon)');
  });

  it('should render archived correctly', () => {
    const project = {
      state_of_sale: StateOfSale.Ready,
      archived: true,
      published: false,
    };
    const input = getProjectState(project);

    expect(input).toEqual('Valmis (Arkistoitu)');
  });
});
