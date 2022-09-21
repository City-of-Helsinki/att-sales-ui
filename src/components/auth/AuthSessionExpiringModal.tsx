import React, { useEffect, useState } from 'react';
import { Button, Dialog, IconAlertCircle } from 'hds-react';
import { Trans, useTranslation } from 'react-i18next';
import { useIdleTimerContext } from 'react-idle-timer';
import { useSelector, useDispatch } from 'react-redux';

import { RootState } from '../../redux/store';
import { TIMEOUT_MINUTES } from './WithIdleProvider';
import { getClient } from '../../auth/oidc-react';
import { hideAuthSessionExpiringModal } from '../../redux/features/authSessionExpiringModalSlice';

const T_PATH = 'components.auth.AuthSessionExpiringModal';

const INITIAL_SECONDS = 60;

const Timer = () => {
  const [secondsRemaining, setSecondsRemaining] = useState(INITIAL_SECONDS);

  useEffect(() => {
    let isMounted = true;
    if (secondsRemaining > 0) {
      setTimeout(() => isMounted && setSecondsRemaining(secondsRemaining - 1), 1000);
    }
    return () => {
      isMounted = false;
    };
  }, [secondsRemaining]);

  return <>{secondsRemaining}</>;
};

const AuthSessionExpiringModal = () => {
  const { t } = useTranslation();
  const authSessionExpiringModal = useSelector((state: RootState) => state.authSessionExpiringModal);
  const dispatch = useDispatch();
  const client = getClient();
  const idleTimer = useIdleTimerContext();

  const isDialogOpen = authSessionExpiringModal.isOpened;
  const titleId = 'session-expiring-dialog-title';
  const descriptionId = 'session-expiring-dialog-info';

  const closeDialog = () => {
    dispatch(hideAuthSessionExpiringModal());
  };

  const handleContinue = () => {
    idleTimer.reset();
    closeDialog();
  };

  if (!isDialogOpen) return null;

  return (
    <>
      <Dialog id="confirmation-dialog" aria-labelledby={titleId} aria-describedby={descriptionId} isOpen={isDialogOpen}>
        <Dialog.Header
          id={titleId}
          title={t(`${T_PATH}.continueUsingTheService`)}
          iconLeft={<IconAlertCircle aria-hidden="true" />}
        />
        <Dialog.Content>
          <p id={descriptionId}>
            <Trans i18nKey={`${T_PATH}.inactivityMessage`}>
              You have been inactive for {TIMEOUT_MINUTES} minutes. You will be logged out automatically in <Timer />{' '}
              seconds.
            </Trans>
          </p>
        </Dialog.Content>
        <Dialog.ActionButtons>
          <Button onClick={handleContinue}>{t(`${T_PATH}.continue`)}</Button>
          <Button onClick={() => client.logout()} variant="secondary">
            {t(`${T_PATH}.logout`)}
          </Button>
        </Dialog.ActionButtons>
      </Dialog>
    </>
  );
};

export default AuthSessionExpiringModal;
