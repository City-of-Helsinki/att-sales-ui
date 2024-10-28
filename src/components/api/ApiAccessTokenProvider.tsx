import React, { FC, useEffect } from 'react';
import { useIsAuthorizationReady } from '../../redux/useIsAuthReady';
import { getApiTokensFromStorage, LoadingSpinner } from 'hds-react';

export const ApiAccessTokenContext = React.createContext<null>(null);

interface Props {
  children: React.ReactNode;
}

export const ApiAccessTokenProvider: FC<Props> = ({ children }) => {
  const [isReady, loading] = useIsAuthorizationReady();

  useEffect(() => {
    // Make sure api tokens are available
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const tokens = getApiTokensFromStorage();
  }, [isReady, loading]);

  if (!isReady && loading) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
};
