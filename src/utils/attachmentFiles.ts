import { waitForApiToken } from '../redux/services/common';
import getApiBaseUrl from './getApiBaseUrl';

const OBJECT_URL_REVOKE_DELAY_MS = 60000;

const resolveAttachmentUrl = (url: string): URL => {
  const baseUrl = new URL(getApiBaseUrl(), window.location.origin);
  const resolved = new URL(url, baseUrl);

  // The API token must never be sent to a foreign host
  if (resolved.origin !== baseUrl.origin && resolved.origin !== window.location.origin) {
    throw new Error('Attachment URL origin is not allowed');
  }

  return resolved;
};

/**
 * Fetches an attachment as a Blob with the same Authorization header as other v1 API requests.
 */
export const fetchAttachmentBlob = async (url: string): Promise<Blob> => {
  const apiToken = await waitForApiToken();
  const response = await fetch(resolveAttachmentUrl(url).toString(), {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiToken}` },
  });

  if (!response.ok) {
    throw new Error(`Attachment request failed with status ${response.status}`);
  }

  return response.blob();
};

/**
 * Opens an attachment in a new tab. The tab is opened synchronously (before the request)
 * so that popup blockers treat it as a result of the user's click.
 */
export const openAttachmentInNewTab = async (url: string): Promise<void> => {
  const newTab = window.open('', '_blank');

  if (!newTab) {
    throw new Error('Unable to open a new tab');
  }

  newTab.opener = null;

  try {
    const blob = await fetchAttachmentBlob(url);
    const objectUrl = URL.createObjectURL(blob);

    newTab.location.href = objectUrl;
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), OBJECT_URL_REVOKE_DELAY_MS);
  } catch (error) {
    newTab.close();
    throw error;
  }
};

/**
 * Downloads an attachment through a temporary anchor element.
 */
export const downloadAttachmentFile = async (url: string, fileName?: string): Promise<void> => {
  const blob = await fetchAttachmentBlob(url);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = objectUrl;
  anchor.download = fileName || '';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
};
