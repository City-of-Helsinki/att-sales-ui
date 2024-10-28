import { Header } from 'hds-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

const T_PATH = 'components.common.auth.Login';

const Login = (): React.ReactElement => {
  const { t } = useTranslation();
  return (
    <Header.LoginButton
      label={t(`${T_PATH}.login`)}
      id="action-bar-login-action"
      errorLabel={t(`${T_PATH}.error.label`)}
      errorText={t(`${T_PATH}.error.text`)}
      errorCloseAriaLabel={t(`${T_PATH}.error.close`)}
      loggingInText={t(`${T_PATH}.loggingIn`)}
      fixedRightPosition
    />
  );
};

export default Login;
