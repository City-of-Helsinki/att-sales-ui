import { rest } from 'msw';
import { fireEvent, screen, waitFor } from '@testing-library/react';

import CustomerReservationMessages from './CustomerReservationMessages';
import { toast } from '../common/toast/ToastManager';
import { CustomerReservation } from '../../types';
import mockCustomer from '../../mocks/customer.json';
import { renderWithProviders } from '../../test/test-utils';
import { server } from '../../test/server';

const reservation = (mockCustomer as any).apartment_reservations[0] as CustomerReservation;

const renderComponent = () => {
  renderWithProviders(<CustomerReservationMessages reservations={[reservation]} />);
};

const T = 'components.customers.CustomerReservationMessages';
const API = process.env.REACT_APP_API_BASE_URL;

const uploadFile = (file: File) => {
  fireEvent.change(screen.getByTestId('attachment-file-input'), { target: { files: [file] } });
};

const messageCreatedResponse = (body: string) => ({
  id: 999,
  application_id: 42,
  project_id: 7,
  sender_role: 'sales',
  sender_uid: null,
  salesperson_uid: 12,
  recipient_mail: '',
  body,
  created: 1715007200,
  created_at: '2026-10-28T10:00:00Z',
  attachments: [],
});

describe('CustomerReservationMessages', () => {
  afterEach(() => {
    delete process.env.REACT_APP_ENABLE_MANUAL_ATTACHMENT_IDS;
  });

  describe('file upload', () => {
    it('hides manual file_id inputs by default', async () => {
      renderComponent();

      await screen.findByLabelText(`${T}.newMessageLabel`);

      expect(screen.getByText(`${T}.chooseFile`)).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(`${T}.newAttachmentIdPlaceholder`)).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText(`${T}.attachmentIdPlaceholder`)).not.toBeInTheDocument();
    });

    it('uploads a file, adds it to the draft and sends new_attachments', async () => {
      let uploadUrl: URL | null = null;
      let uploadContentType: string | null = null;
      let messagePayload: any = null;

      server.use(
        rest.post(`${API}/apartment_reservations/:reservationId/messages/attachments/upload`, (req, res, ctx) => {
          uploadUrl = req.url;
          uploadContentType = req.headers.get('content-type');

          return res(
            ctx.status(201),
            ctx.json({ file_id: 321, display_name: 'Terms.pdf', mime_type: 'application/pdf', size_bytes: 2048 })
          );
        }),
        rest.post(`${API}/apartment_reservations/:reservationId/messages/`, (req, res, ctx) => {
          messagePayload = req.body;

          return res(ctx.status(201), ctx.json(messageCreatedResponse((req.body as any)?.body || '')));
        })
      );

      renderComponent();

      await screen.findByLabelText(`${T}.newMessageLabel`);
      fireEvent.change(screen.getByLabelText(`${T}.newMessageLabel`), { target: { value: 'Hei' } });

      uploadFile(new File(['content'], 'Terms.pdf', { type: 'application/pdf' }));

      await screen.findByText('Terms.pdf');
      expect(screen.getByText(/application\/pdf - 2\.0 KB/)).toBeInTheDocument();
      expect(uploadUrl).not.toBeNull();
      // the JSON content type must not be forced on multipart requests
      expect(String(uploadContentType)).not.toContain('application/json');

      fireEvent.click(screen.getByText(`${T}.send`));

      await waitFor(() => {
        expect(messagePayload).toBeTruthy();
      });
      expect(messagePayload.body).toBe('Hei');
      expect(messagePayload.new_attachments).toEqual([{ file_id: 321, display_name: 'Terms.pdf' }]);
      expect(messagePayload).not.toHaveProperty('attachment_ids');
    });

    it('removes an uploaded file from the draft before submit', async () => {
      let messagePayload: any = null;

      server.use(
        rest.post(`${API}/apartment_reservations/:reservationId/messages/attachments/upload`, (_req, res, ctx) => {
          return res(ctx.status(201), ctx.json({ file_id: 5, display_name: 'A.pdf' }));
        }),
        rest.post(`${API}/apartment_reservations/:reservationId/messages/`, (req, res, ctx) => {
          messagePayload = req.body;

          return res(ctx.status(201), ctx.json(messageCreatedResponse('Hei')));
        })
      );

      renderComponent();

      await screen.findByLabelText(`${T}.newMessageLabel`);
      fireEvent.change(screen.getByLabelText(`${T}.newMessageLabel`), { target: { value: 'Hei' } });
      uploadFile(new File(['x'], 'A.pdf', { type: 'application/pdf' }));

      await screen.findByText('A.pdf');
      fireEvent.click(screen.getByText(`${T}.removeAttachment`));
      expect(screen.queryByText('A.pdf')).not.toBeInTheDocument();

      fireEvent.click(screen.getByText(`${T}.send`));

      await waitFor(() => {
        expect(messagePayload).toBeTruthy();
      });
      expect(messagePayload).not.toHaveProperty('new_attachments');
    });

    it('shows invalid file error in the upload block on 422', async () => {
      server.use(
        rest.post(`${API}/apartment_reservations/:reservationId/messages/attachments/upload`, (_req, res, ctx) => {
          return res(ctx.status(422), ctx.json({ file: ['invalid_file'] }));
        })
      );

      renderComponent();

      await screen.findByLabelText(`${T}.newMessageLabel`);
      uploadFile(new File(['x'], 'bad.exe', { type: 'application/x-msdownload' }));

      await screen.findByText(`${T}.uploadInvalidFileError`);
      expect(screen.queryByText('bad.exe')).not.toBeInTheDocument();
    });

    it('shows too many attempts error on 429', async () => {
      server.use(
        rest.post(`${API}/apartment_reservations/:reservationId/messages/attachments/upload`, (_req, res, ctx) => {
          return res(ctx.status(429), ctx.json({ detail: 'Too many requests' }));
        })
      );

      renderComponent();

      await screen.findByLabelText(`${T}.newMessageLabel`);
      uploadFile(new File(['x'], 'A.pdf', { type: 'application/pdf' }));

      await screen.findByText(`${T}.errorTooManyRequests`);
    });

    it('shows unavailable error on 403', async () => {
      server.use(
        rest.post(`${API}/apartment_reservations/:reservationId/messages/attachments/upload`, (_req, res, ctx) => {
          return res(ctx.status(403), ctx.json({ detail: 'Forbidden' }));
        })
      );

      renderComponent();

      await screen.findByLabelText(`${T}.newMessageLabel`);
      uploadFile(new File(['x'], 'A.pdf', { type: 'application/pdf' }));

      await screen.findByText(`${T}.uploadUnavailableError`);
    });

    it('shows temporary error on 503', async () => {
      server.use(
        rest.post(`${API}/apartment_reservations/:reservationId/messages/attachments/upload`, (_req, res, ctx) => {
          return res(ctx.status(503), ctx.json({ detail: 'Unavailable' }));
        })
      );

      renderComponent();

      await screen.findByLabelText(`${T}.newMessageLabel`);
      uploadFile(new File(['x'], 'A.pdf', { type: 'application/pdf' }));

      await screen.findByText(`${T}.errorTemporary`);
    });
  });

  it('sends only body when no attachments are selected', async () => {
    let requestPayload: any = null;

    server.use(
      rest.post(`${API}/apartment_reservations/:reservationId/messages/`, (req, res, ctx) => {
        requestPayload = req.body;

        return res(ctx.status(201), ctx.json(messageCreatedResponse('Hei')));
      })
    );

    renderComponent();

    await screen.findByLabelText(`${T}.newMessageLabel`);
    fireEvent.change(screen.getByLabelText(`${T}.newMessageLabel`), { target: { value: 'Hei' } });
    fireEvent.click(screen.getByText(`${T}.send`));

    await waitFor(() => {
      expect(requestPayload).toBeTruthy();
    });
    expect(requestPayload).toEqual({ body: 'Hei' });
  });

  it('submits message with attachment_ids (manual fallback enabled)', async () => {
    process.env.REACT_APP_ENABLE_MANUAL_ATTACHMENT_IDS = 'true';
    let requestPayload: any = null;

    server.use(
      rest.post(
        `${process.env.REACT_APP_API_BASE_URL}/apartment_reservations/:reservationId/messages/`,
        async (req, res, ctx) => {
          requestPayload = req.body;

          return res(
            ctx.status(201),
            ctx.json({
              id: 999,
              application_id: 42,
              project_id: 7,
              sender_role: 'sales',
              sender_uid: null,
              salesperson_uid: 12,
              recipient_mail: '',
              body: (requestPayload as any)?.body || '',
              created: 1715007200,
              created_at: '2026-10-28T10:00:00Z',
              attachments: [],
            })
          );
        }
      )
    );

    renderComponent();

    await screen.findByLabelText('components.customers.CustomerReservationMessages.newMessageLabel');

    fireEvent.change(screen.getByLabelText('components.customers.CustomerReservationMessages.newMessageLabel'), {
      target: { value: 'Hei' },
    });
    fireEvent.change(
      screen.getByPlaceholderText('components.customers.CustomerReservationMessages.attachmentIdPlaceholder'),
      {
        target: { value: '10' },
      }
    );
    fireEvent.click(screen.getByText('components.customers.CustomerReservationMessages.addAttachment'));
    fireEvent.click(screen.getByText('components.customers.CustomerReservationMessages.send'));

    await waitFor(() => {
      expect(requestPayload).toBeTruthy();
    });
    expect((requestPayload as any).body).toBe('Hei');
    expect((requestPayload as any).attachment_ids).toEqual([10]);
  });

  it('renders attachments from thread response', async () => {
    server.use(
      rest.get(
        `${process.env.REACT_APP_API_BASE_URL}/apartment_reservations/:reservationId/messages/`,
        (_req, res, ctx) => {
          return res(
            ctx.json({
              application_id: 42,
              count: 1,
              items: [
                {
                  id: 110,
                  application_id: 42,
                  project_id: 7,
                  sender_role: 'sales',
                  sender_uid: null,
                  salesperson_uid: 12,
                  recipient_mail: '',
                  body: 'Message with attachment',
                  created: 1715003600,
                  created_at: '2026-10-28T09:00:00Z',
                  attachments: [
                    {
                      id: 901,
                      display_name: 'Terms.pdf',
                      mime_type: 'application/pdf',
                      size_bytes: 2048,
                      download_url: 'https://example.com/download/901',
                    },
                  ],
                },
              ],
            })
          );
        }
      )
    );

    renderComponent();

    await screen.findByText('Terms.pdf');
    expect(screen.getByText('application/pdf - 2.0 KB')).toBeInTheDocument();
    const downloadLink = screen.getByRole('link', {
      name: 'components.customers.CustomerReservationMessages.openAttachment',
    });
    expect(downloadLink).toHaveAttribute('href', 'https://example.com/download/901');
  });

  it('shows 422 attachment_ids validation error near attachments block', async () => {
    process.env.REACT_APP_ENABLE_MANUAL_ATTACHMENT_IDS = 'true';
    server.use(
      rest.post(
        `${process.env.REACT_APP_API_BASE_URL}/apartment_reservations/:reservationId/messages/`,
        (_req, res, ctx) => {
          return res(ctx.status(422), ctx.json({ attachment_ids: ['invalid_attachments'] }));
        }
      )
    );

    renderComponent();

    await screen.findByLabelText('components.customers.CustomerReservationMessages.newMessageLabel');

    fireEvent.change(screen.getByLabelText('components.customers.CustomerReservationMessages.newMessageLabel'), {
      target: { value: 'Hei' },
    });
    fireEvent.change(
      screen.getByPlaceholderText('components.customers.CustomerReservationMessages.attachmentIdPlaceholder'),
      {
        target: { value: '11' },
      }
    );
    fireEvent.click(screen.getByText('components.customers.CustomerReservationMessages.addAttachment'));
    fireEvent.click(screen.getByText('components.customers.CustomerReservationMessages.send'));

    await screen.findByText('components.customers.CustomerReservationMessages.invalidAttachmentsError');
  });

  it('shows 422 new_attachments validation error near new attachments block', async () => {
    process.env.REACT_APP_ENABLE_MANUAL_ATTACHMENT_IDS = 'true';
    server.use(
      rest.post(
        `${process.env.REACT_APP_API_BASE_URL}/apartment_reservations/:reservationId/messages/`,
        (_req, res, ctx) => {
          return res(ctx.status(422), ctx.json({ new_attachments: ['invalid_new_attachments'] }));
        }
      )
    );

    renderComponent();

    await screen.findByLabelText('components.customers.CustomerReservationMessages.newMessageLabel');

    fireEvent.change(screen.getByLabelText('components.customers.CustomerReservationMessages.newMessageLabel'), {
      target: { value: 'Hei' },
    });
    fireEvent.change(
      screen.getByPlaceholderText('components.customers.CustomerReservationMessages.newAttachmentIdPlaceholder'),
      {
        target: { value: '123' },
      }
    );
    fireEvent.change(
      screen.getByPlaceholderText('components.customers.CustomerReservationMessages.newAttachmentNamePlaceholder'),
      {
        target: { value: 'Offer.pdf' },
      }
    );
    fireEvent.click(screen.getByText('components.customers.CustomerReservationMessages.addNewAttachment'));
    fireEvent.click(screen.getByText('components.customers.CustomerReservationMessages.send'));

    await screen.findByText('components.customers.CustomerReservationMessages.invalidNewAttachmentsError');
  });

  it('shows user-friendly error on 429', async () => {
    const toastSpy = jest.spyOn(toast, 'show');

    server.use(
      rest.post(
        `${process.env.REACT_APP_API_BASE_URL}/apartment_reservations/:reservationId/messages/`,
        (_req, res, ctx) => {
          return res(ctx.status(429), ctx.json({ detail: 'Too many requests' }));
        }
      )
    );

    renderComponent();

    await screen.findByLabelText('components.customers.CustomerReservationMessages.newMessageLabel');

    fireEvent.change(screen.getByLabelText('components.customers.CustomerReservationMessages.newMessageLabel'), {
      target: { value: 'Hei' },
    });
    fireEvent.click(screen.getByText('components.customers.CustomerReservationMessages.send'));

    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalledWith({
        type: 'error',
        content: 'components.customers.CustomerReservationMessages.errorTooManyRequests',
      });
    });

    toastSpy.mockRestore();
  });
});
