import { rest } from 'msw';

import mockProjects from '../../mocks/projects.json';
import mockProject from '../../mocks/project.json';
import mockApartments from '../../mocks/apartments.json';
import mockCustomer from '../../mocks/customer.json';
import mockCustomers from '../../mocks/customers.json';
import mockApartmentReservation from '../../mocks/apartment_reservation.json';
import mockSalesPersons from '../../mocks/salespersons.json';

const mockReservationMessages = [
  {
    id: 101,
    application_id: 42,
    project_id: 7,
    sender_role: 'applicant',
    sender_uid: 5,
    salesperson_uid: null,
    recipient_mail: 'applicant@example.com',
    body: 'Hello, I have a question about the contract.',
    created: 1715000000,
  },
  {
    id: 102,
    application_id: 42,
    project_id: 7,
    sender_role: 'sales',
    sender_uid: null,
    salesperson_uid: 12,
    recipient_mail: '',
    body: 'Hi! Here is the answer from sales.',
    created: 1715003600,
  },
];

const handlers = [
  rest.get(`${process.env.REACT_APP_API_BASE_URL}/apartments`, (_req, res, ctx) => {
    return res(ctx.json([mockApartments[0]]));
  }),
  rest.get(`${process.env.REACT_APP_API_BASE_URL}/projects`, (_req, res, ctx) => {
    return res(ctx.json(mockProjects));
  }),
  rest.get(`${process.env.REACT_APP_API_BASE_URL}/projects/:projectId`, (_req, res, ctx) => {
    return res(ctx.json(mockProject));
  }),
  rest.get(`${process.env.REACT_APP_API_BASE_URL}/customers/:customerId`, (_req, res, ctx) => {
    return res(ctx.json(mockCustomer));
  }),
  rest.get(`${process.env.REACT_APP_API_BASE_URL}/customers/:customerId/apartment_reservations/`, (_req, res, ctx) => {
    const results = (mockCustomer as any).apartment_reservations ?? [];
    return res(
      ctx.json({
        count: results.length,
        next: null,
        previous: null,
        results,
      })
    );
  }),
  rest.get(`${process.env.REACT_APP_API_BASE_URL}/customers`, (_req, res, ctx) => {
    return res(ctx.json(mockCustomers));
  }),
  rest.get(`${process.env.REACT_APP_API_BASE_URL}/apartment_reservations/:reservationId`, (_req, res, ctx) => {
    return res(ctx.json(mockApartmentReservation));
  }),
  rest.get(
    `${process.env.REACT_APP_API_BASE_URL}/apartment_reservations/:reservationId/messages/`,
    (_req, res, ctx) => {
      return res(
        ctx.json({
          application_id: 42,
          count: mockReservationMessages.length,
          items: mockReservationMessages,
        })
      );
    }
  ),
  rest.post(
    `${process.env.REACT_APP_API_BASE_URL}/apartment_reservations/:reservationId/messages/`,
    async (req, res, ctx) => {
      const payload = req.body as { body?: string } | null;
      const body = typeof payload?.body === 'string' ? payload.body.trim() : '';

      if (!body) {
        return res(ctx.status(400), ctx.json({ body: ['Message body cannot be empty.'] }));
      }

      return res(
        ctx.status(201),
        ctx.json({
          id: 103,
          application_id: 42,
          project_id: 7,
          sender_role: 'sales',
          sender_uid: null,
          salesperson_uid: 12,
          recipient_mail: '',
          body,
          created: 1715007200,
        })
      );
    }
  ),
  rest.get(`${process.env.REACT_APP_API_BASE_URL}/salespersons`, (_req, res, ctx) => {
    return res(ctx.json(mockSalesPersons));
  }),
];

export { handlers };
