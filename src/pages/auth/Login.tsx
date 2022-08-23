import React from 'react';
import { Button, Card } from 'hds-react';
import { useTranslation } from 'react-i18next';

import Container from '../../components/common/container/Container';
import { getClientConfig } from '../../auth/index';
import { useClient } from '../../auth/hooks';
import { usePageTitle } from '../../utils/usePageTitle';

const T_PATH = 'pages.auth.Login';

const Login = (): JSX.Element | null => {
  const { t } = useTranslation();
  const currentConfig = getClientConfig();
  const { isAuthenticated, login } = useClient();

  usePageTitle(t('PAGES.login'));

  const isLoggedIn = (): boolean => {
    if (!currentConfig) {
      return false;
    }
    return isAuthenticated();
  };

  return (
    <Container narrow>
      <Card style={{ textAlign: 'center' }}>
        <h1>{t(`${T_PATH}.loginTitle`)}</h1>
        {isLoggedIn() ? (
          <p>{t(`${T_PATH}.alreadyLoggedIn`)}</p>
        ) : (
          <Button onClick={() => login()}>{t(`${T_PATH}.login`)}</Button>
        )}
      </Card>
    </Container>
  );
};

export default Login;
