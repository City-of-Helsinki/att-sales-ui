import axios from 'axios';

import getApiBaseUrl from './getApiBaseUrl';
import { waitForApiToken } from '../redux/services/common';

export const useFileDownloadApi = async (url: string) => {
  const apiBaseUrl = getApiBaseUrl();
  const apiToken = await waitForApiToken();

  if (apiToken) {
    return () =>
      axios.get(`${apiBaseUrl}${url}`, {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      });
  } else {
    throw new Error('No API token');
  }
};
