import { rest } from 'msw';
import { screen } from '@testing-library/react';

import OfferEmailMessage from './OfferEmailMessage';
import { renderWithProviders } from '../../test/test-utils';
import { server } from '../../test/server';

const offerMessage = {
  subject: 'Tarjous As Oy Test A1',
  body: 'Offer email body content',
  recipients: [
    { name: 'Matti Meikalainen', email: 'matti@example.com' },
    { name: 'Maija Meikalainen', email: 'maija@example.com' },
  ],
};

const defaultProps = {
  reservationId: 1,
  validUntil: '20.7.2026',
  customerId: 42,
  projectUuid: 'project-uuid-1',
};

describe('OfferEmailMessage', () => {
  beforeEach(() => {
    server.use(
      rest.get(`${process.env.REACT_APP_API_BASE_URL}/apartment_reservations/:id/offer_message/`, (_req, res, ctx) =>
        res(ctx.json(offerMessage))
      )
    );
  });

  it('shows automatic send note for new offers and mailto fallback', async () => {
    renderWithProviders(<OfferEmailMessage {...defaultProps} isNewOffer />);

    await screen.findByDisplayValue('Offer email body content');
    expect(screen.getByText('components.offer.OfferEmailMessage.sentToCustomerAutomatically')).toBeInTheDocument();

    const mailto = screen.getByRole('link', {
      name: 'components.offer.OfferEmailMessage.openInEmailApp',
    });
    expect(mailto.getAttribute('href')).toContain('mailto:');
    expect(mailto.getAttribute('href')).toContain(encodeURIComponent('matti@example.com'));
    expect(mailto.getAttribute('href')).toContain(encodeURIComponent(offerMessage.subject));
  });

  it('shows mailto fallback without automatic note when editing an existing offer', async () => {
    renderWithProviders(<OfferEmailMessage {...defaultProps} isNewOffer={false} />);

    await screen.findByDisplayValue('Offer email body content');
    expect(
      screen.queryByText('components.offer.OfferEmailMessage.sentToCustomerAutomatically')
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'components.offer.OfferEmailMessage.openInEmailApp' })).toBeInTheDocument();
  });
});
