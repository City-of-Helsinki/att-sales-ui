import { render, screen } from '@testing-library/react';
import LoadingScreen from './LoadingScreen';

describe('LoadingScreen', () => {
  it('renders loading message', () => {
    render(<LoadingScreen />);
    expect(screen.getByText('components.common.loadingScreen.LoadingScreen.loading...')).toBeDefined();
  });
});
