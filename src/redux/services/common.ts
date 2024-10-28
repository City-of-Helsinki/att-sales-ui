import { getApiTokensFromStorage } from 'hds-react';

const RETRY_TIME_MS = 200;
const MAX_RETRY_ATTEMPTS = 10;

const wait = (waitForMs: number) =>
  new Promise<void>((resolve) => {
    setTimeout(() => resolve(), waitForMs);
  });

const getApiToken = () => {
  const tokens = getApiTokensFromStorage();
  return tokens ? tokens[String(process.env[`REACT_APP_API_AUDIENCE`])] : undefined;
};

export const waitForApiToken = async () => {
  const retryAttempts = 0;
  while (retryAttempts <= MAX_RETRY_ATTEMPTS) {
    const apiToken = getApiToken();
    if (apiToken) {
      return apiToken;
    }
    await wait(RETRY_TIME_MS);
  }
  throw new Error('Failed to get API token');
};
