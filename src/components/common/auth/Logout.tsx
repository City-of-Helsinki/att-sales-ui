import { Header, IconSignout, useOidcClient } from 'hds-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

const T_PATH = 'components.common.auth.Logout';

const Logout = (): React.ReactElement => {
  const { t } = useTranslation();
  const { logout } = useOidcClient();

  return (
    <Header.ActionBarButton
      label={t(`${T_PATH}.logout`)}
      fixedRightPosition
      icon={<IconSignout />}
      onClick={() => logout()}
    />
  );
};

export default Logout;
