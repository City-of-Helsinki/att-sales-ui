import { render } from '@testing-library/react';

import Spinner from './Spinner';

describe('Spinner', () => {
  it('renders the component', () => {
    const { container } = render(<Spinner />);
    // eslint-disable-next-line testing-library/no-node-access
    const element = container.firstChild;
    expect(element).toBeDefined();
  });
});
