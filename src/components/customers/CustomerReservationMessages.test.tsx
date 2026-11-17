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

  describe('thread attachments', () => {
    const mockThreadWithAttachment = (attachment: Record<string, unknown>) => {
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
                        ...attachment,
                      },
                    ],
                  },
                ],
              })
            );
          }
        )
      );
    };

    describe('open and download', () => {
      const originalCreateObjectURL = URL.createObjectURL;
      const originalRevokeObjectURL = URL.revokeObjectURL;
      let openSpy: jest.SpyInstance;
      let clickSpy: jest.SpyInstance;
      let fakeTab: { location: { href: string }; close: jest.Mock; opener: unknown };

      beforeEach(() => {
        URL.createObjectURL = jest.fn(() => 'blob:attachment');
        URL.revokeObjectURL = jest.fn();
        fakeTab = { location: { href: '' }, close: jest.fn(), opener: {} };
        openSpy = jest.spyOn(window, 'open').mockReturnValue(fakeTab as unknown as Window);
        clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
      });

      afterEach(() => {
        URL.createObjectURL = originalCreateObjectURL;
        URL.revokeObjectURL = originalRevokeObjectURL;
        openSpy.mockRestore();
        clickSpy.mockRestore();
      });

      const mockFileEndpoint = (path: string, onRequest: (authorization: string | null) => void, status = 200) => {
        server.use(
          rest.get(`${API}${path}`, (req, res, ctx) => {
            onRequest(req.headers.get('authorization'));

            return res(ctx.status(status), ctx.set('Content-Type', 'application/pdf'), ctx.body('pdf-content'));
          })
        );
      };

      it('renders buttons instead of plain links', async () => {
        mockThreadWithAttachment({
          open_url: `${API}/files/open/901`,
          download_url: `${API}/files/download/901`,
        });

        renderComponent();

        await screen.findByText('Terms.pdf');
        expect(screen.getByText('application/pdf - 2.0 KB')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: `${T}.openAttachment` })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: `${T}.downloadAttachment` })).toBeInTheDocument();
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
      });

      it('opens open_url as an authenticated blob in a new tab', async () => {
        let authorization: string | null = null;
        mockThreadWithAttachment({
          open_url: `${API}/files/open/901`,
          download_url: `${API}/files/download/901`,
        });
        mockFileEndpoint('/files/open/901', (value) => {
          authorization = value;
        });

        renderComponent();

        await screen.findByText('Terms.pdf');
        fireEvent.click(screen.getByRole('button', { name: `${T}.openAttachment` }));

        await waitFor(() => {
          expect(fakeTab.location.href).toBe('blob:attachment');
        });
        expect(authorization).toBe('Bearer test-token');
        expect(openSpy).toHaveBeenCalledWith('', '_blank');
        expect(fakeTab.opener).toBeNull();
      });

      it('downloads download_url as an authenticated blob via a temporary anchor', async () => {
        let authorization: string | null = null;
        mockThreadWithAttachment({
          open_url: `${API}/files/open/901`,
          download_url: `${API}/files/download/901`,
        });
        mockFileEndpoint('/files/download/901', (value) => {
          authorization = value;
        });

        renderComponent();

        await screen.findByText('Terms.pdf');
        fireEvent.click(screen.getByRole('button', { name: `${T}.downloadAttachment` }));

        await waitFor(() => {
          expect(clickSpy).toHaveBeenCalledTimes(1);
        });
        const anchor = clickSpy.mock.instances[0] as HTMLAnchorElement;
        expect(anchor.download).toBe('Terms.pdf');
        expect(anchor.href).toBe('blob:attachment');
        expect(authorization).toBe('Bearer test-token');
      });

      it('uses download_url for open when open_url is missing', async () => {
        let requested = false;
        mockThreadWithAttachment({ download_url: `${API}/files/download/901` });
        mockFileEndpoint('/files/download/901', () => {
          requested = true;
        });

        renderComponent();

        await screen.findByText('Terms.pdf');
        fireEvent.click(screen.getByRole('button', { name: `${T}.openAttachment` }));

        await waitFor(() => {
          expect(fakeTab.location.href).toBe('blob:attachment');
        });
        expect(requested).toBe(true);
      });

      it('supports legacy attachments with a single download link', async () => {
        const requestedAuth: Array<string | null> = [];
        mockThreadWithAttachment({ download: `${API}/files/legacy/901` });
        mockFileEndpoint('/files/legacy/901', (value) => {
          requestedAuth.push(value);
        });

        renderComponent();

        await screen.findByText('Terms.pdf');
        expect(screen.getByText('application/pdf - 2.0 KB')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: `${T}.openAttachment` }));
        await waitFor(() => {
          expect(fakeTab.location.href).toBe('blob:attachment');
        });

        fireEvent.click(screen.getByRole('button', { name: `${T}.downloadAttachment` }));
        await waitFor(() => {
          expect(clickSpy).toHaveBeenCalledTimes(1);
        });
        expect(requestedAuth).toEqual(['Bearer test-token', 'Bearer test-token']);
      });

      it('shows an error and closes the tab when the request fails', async () => {
        const toastSpy = jest.spyOn(toast, 'show');
        mockThreadWithAttachment({ open_url: `${API}/files/open/901`, download_url: `${API}/files/download/901` });
        mockFileEndpoint('/files/open/901', () => undefined, 403);

        renderComponent();

        await screen.findByText('Terms.pdf');
        fireEvent.click(screen.getByRole('button', { name: `${T}.openAttachment` }));

        await waitFor(() => {
          expect(toastSpy).toHaveBeenCalledWith({ type: 'error', content: `${T}.attachmentFileError` });
        });
        expect(fakeTab.close).toHaveBeenCalled();

        toastSpy.mockRestore();
      });
    });
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
