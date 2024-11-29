import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { isCallbackUrl } from '../../auth/index';
import { ROUTES } from '../../enums';
import { LoginCallbackHandler, OidcClientError, useOidcClient } from 'hds-react';

const HandleCallback = (props: React.PropsWithChildren<unknown>): React.ReactElement => {
  const { children } = props;
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useOidcClient();
  const isCallBack = isCallbackUrl(location.pathname);

  const onSuccess = () => {
    navigate(ROUTES.INDEX, { replace: true });
  };

  const onError = (error: OidcClientError | undefined) => {
    // eslint-disable-next-line no-console
    console.error(error);
    if (!error) return;

    navigate(ROUTES.AUTH_ERROR, { replace: true });
  };

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
