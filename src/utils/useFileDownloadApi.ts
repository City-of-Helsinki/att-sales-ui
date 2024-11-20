import axios from 'axios';

import getApiBaseUrl from './getApiBaseUrl';
import { getApiToken } from '../redux/services/common';

export const useFileDownloadApi = (url: string) => {
  const apiBaseUrl = getApiBaseUrl();
  const apiToken = getApiToken();

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
