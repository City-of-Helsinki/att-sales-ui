import { render, screen } from '@testing-library/react';
import NotFound from './NotFound';

describe('NotFound Page', () => {
  it('renders 404 message', () => {
    render(<NotFound />);
    expect(screen.getByText('404', { exact: false })).toBeDefined();
  });
});
