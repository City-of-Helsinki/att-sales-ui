import React from 'react';
import { Button, Card, useOidcClient } from 'hds-react';
import { useTranslation } from 'react-i18next';

import Container from '../../components/common/container/Container';
import { usePageTitle } from '../../utils/usePageTitle';

const T_PATH = 'pages.auth.Login';

const Login = (): JSX.Element | null => {
  const { t } = useTranslation();
  const { isAuthenticated, login } = useOidcClient();

  usePageTitle(t('PAGES.login'));

  return (
    <Container narrow>
      <Card style={{ textAlign: 'center' }}>
        <h1>{t(`${T_PATH}.loginTitle`)}</h1>
        {isAuthenticated() ? (
          <p>{t(`${T_PATH}.alreadyLoggedIn`)}</p>
        ) : (
          <Button onClick={() => login()}>{t(`${T_PATH}.login`)}</Button>
        )}
      </Card>
    </Container>
  );
};

export default Login;
