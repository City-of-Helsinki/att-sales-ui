import React from 'react';
import { Notification } from 'hds-react';
import { useTranslation } from 'react-i18next';

import Container from '../../components/common/container/Container';
import { usePageTitle } from '../../utils/usePageTitle';

const T_PATH = 'pages.auth.AuthError';

const AuthError = (): React.ReactElement => {
  const { t } = useTranslation();
  usePageTitle(t('PAGES.authError'));

  return (
    <Container narrow>
      <Notification label={t(`${T_PATH}.errorTitle`)} type="error" style={{ marginTop: 30 }}>
        {t(`${T_PATH}.authError`)}
      </Notification>
    </Container>
  );
};

export default AuthError;
