import { useApiTokensClient, useApiTokensClientTracking, useOidcClient } from 'hds-react';
import { useRef } from 'react';

// eslint-disable-next-line import/prefer-default-export
export function useIsAuthorizationReady(): [boolean, boolean, boolean, boolean] {
  const { isAuthenticated, isRenewing: isRenewingSession } = useOidcClient();
  const { getTokens, isRenewing: isRenewingApiToken } = useApiTokensClient();
  const hasFetchedTokensOnce = useRef<boolean>(false);

  // The isRenewing* -properties are not updating the hook!
  // All the signals needs to be tracked,
  // because otherwise the initial loading is not returned properly
  // and the profile provider will keep spinning forever.
  useApiTokensClientTracking();

  const isLoggedIn = isAuthenticated();
  const hasTokens = Boolean(getTokens());
  const loading = isRenewingSession() || isRenewingApiToken();
  const isReady = isLoggedIn && hasTokens;

  if (!hasFetchedTokensOnce.current && hasTokens) {
    hasFetchedTokensOnce.current = true;
  }

  return [isReady, loading, isLoggedIn, hasFetchedTokensOnce.current];
}
