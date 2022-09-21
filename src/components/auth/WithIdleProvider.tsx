import React, { FC } from 'react';
import { IdleTimerProvider } from 'react-idle-timer';
import { useDispatch, useSelector } from 'react-redux';

import { getClient } from '../../auth/oidc-react';
import {
  hideAuthSessionExpiringModal,
  showAuthSessionExpiringModal,
} from '../../redux/features/authSessionExpiringModalSlice';
import { RootState } from '../../redux/store';

export const TIMEOUT_MINUTES = process.env.REACT_APP_IDLE_TIMEOUT_MINUTES || '15';

const IdleTimer: FC<unknown> = ({ children }) => {
  const client = getClient();
  const dispatch = useDispatch();
  const isModalOpen = useSelector((state: RootState) => state.authSessionExpiringModal.isOpened);

  const onPrompt = (): void => {
    dispatch(showAuthSessionExpiringModal());
  };

  const onIdle = (): void => {
    dispatch(hideAuthSessionExpiringModal());
    client.logout();
  };

  const onActive = (): void => {
    if (isModalOpen) {
      dispatch(hideAuthSessionExpiringModal());
    }
  };

  return (
    <IdleTimerProvider
      timeout={1000 * 60 * parseInt(TIMEOUT_MINUTES)}
      onPrompt={onPrompt}
      onIdle={onIdle}
      onActive={onActive}
      promptTimeout={1000 * 60}
      name="att-sales-ui-idle-timer"
      startOnMount
      crossTab
      syncTimers={1000}
    >
      {children}
    </IdleTimerProvider>
  );
};

export default IdleTimer;
