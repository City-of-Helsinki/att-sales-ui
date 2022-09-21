import { render, screen } from '@testing-library/react';
import AuthError from './AuthError';

describe('AuthError Page', () => {
  it('renders error message', () => {
    render(<AuthError />);
    expect(screen.getByText('pages.auth.AuthError.authError')).toBeDefined();
  });
});
