import React from 'react';
import { Card, useOidcClient } from 'hds-react';
import { useTranslation } from 'react-i18next';

import Container from '../../components/common/container/Container';
import { usePageTitle } from '../../utils/usePageTitle';

const T_PATH = 'pages.auth.Logout';

const Logout = (): React.ReactElement => {
  const { t } = useTranslation();
  const { isAuthenticated } = useOidcClient();

  usePageTitle(t('PAGES.logout'));

  return (
    <Container narrow>
      <Card style={{ textAlign: 'center' }}>
        <h1>{isAuthenticated() ? t(`${T_PATH}.loggedIn`) : t(`${T_PATH}.loggedOut`)}</h1>
      </Card>
    </Container>
  );
};

export default Logout;
