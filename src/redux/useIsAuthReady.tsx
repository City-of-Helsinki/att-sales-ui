import { useApiTokensClient, useApiTokensClientTracking, useOidcClient } from 'hds-react';

// eslint-disable-next-line import/prefer-default-export
export function useIsAuthorizationReady(): [boolean, boolean] {
  const { isAuthenticated, isRenewing: isRenewingSession } = useOidcClient();
  const { getTokens, isRenewing: isRenewingApiToken } = useApiTokensClient();

  // The isRenewing* -properties are not updating the hook!
  // All the signals needs to be tracked,
  // because otherwise the initial loading is not returned properly
  // and the profile provider will keep spinning forever.
  useApiTokensClientTracking();

  const isLoggedIn = isAuthenticated();
  const hasTokens = Boolean(getTokens());
  const loading = isRenewingSession() || isRenewingApiToken();
  const isReady = isLoggedIn && hasTokens;

  return [isReady, loading];
}
