import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { isCallbackUrl } from '../../auth/index';
import { ROUTES } from '../../enums';
import { LoginCallbackHandler, OidcClientError, useApiTokensClient, useOidcClient, User } from 'hds-react';

const HandleCallback = (props: React.PropsWithChildren<unknown>): React.ReactElement => {
  const { children } = props;
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useOidcClient();
  const [userOrError, setUserOrError] = useState<User | OidcClientError | undefined>(undefined);
  const isCallBack = isCallbackUrl(location.pathname);
  const { fetch } = useApiTokensClient();

  const onSuccess = (user: User) => {
    setUserOrError(user);
    // Following makes sure api tokens are available
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const tokens = fetch(user);
    navigate(ROUTES.INDEX, { replace: true });
  };

  const onError = (error: OidcClientError | undefined) => {
    // eslint-disable-next-line no-console
    console.error(error);
    setUserOrError(error);
    if (!error) return;
    if (
      error.isSignInError &&
      error.message === 'Current state (HANDLING_LOGIN_CALLBACK) cannot be handled by a callback'
    ) {
      // This is HDS issue, should be ignored
      return;
    }
    // navigate(ROUTES.AUTH_ERROR, { replace: true });
  };

  if (userOrError instanceof Error) {
    return <div>Login failed</div>;
  }

  if (!isAuthenticated() && isCallBack) {
    return (
      <LoginCallbackHandler onSuccess={onSuccess} onError={onError}>
        <div>Logging in...</div>
      </LoginCallbackHandler>
    );
  }

  return <>{children}</>;
};

export default HandleCallback;
