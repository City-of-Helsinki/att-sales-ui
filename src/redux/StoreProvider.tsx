import React, { useEffect, FC } from 'react';
import { Provider } from 'react-redux';

import { ClientEvent, ClientErrorObject, User } from '../auth';
import { authorized, connected, errorThrown, initializing, tokenExpired, unauthorized } from './features/authSlice';
import { store } from './store';
import { useClient } from '../auth/hooks';

const StoreProvider: FC<React.PropsWithChildren<unknown>> = ({ children }) => {
  const client = useClient();

  useEffect(() => {
    const getStatus = client.getStatus();
    const isAuthenticated = client.isAuthenticated();
    const isInitialized = client.isInitialized();

    client.addListener(ClientEvent.INITIALIZING, () => {
      store.dispatch(initializing());
    });
    client.addListener(ClientEvent.AUTHORIZED, (payload) => {
      store.dispatch(authorized(payload as User));
    });
    client.addListener(ClientEvent.UNAUTHORIZED, () => {
      store.dispatch(unauthorized());
    });
    client.addListener(ClientEvent.TOKEN_EXPIRING, (payload) => {
      console.warn('TOKEN EXPIRING', payload);
    });
    client.addListener(ClientEvent.TOKEN_EXPIRED, () => {
      store.dispatch(tokenExpired());
    });
    client.addListener(ClientEvent.ERROR, (payload) => {
      store.dispatch(errorThrown(payload as ClientErrorObject));
    });
    store.dispatch(connected({ getStatus, isAuthenticated, isInitialized }));
  }, [client]);

  return <Provider store={store}>{children}</Provider>;
};

export default StoreProvider;
