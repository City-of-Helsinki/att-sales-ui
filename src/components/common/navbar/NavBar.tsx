import React from 'react';
import { Header, Logo, logoFi, LanguageOption, IconSignin, IconSignout } from 'hds-react';
import { useTranslation } from 'react-i18next';

import { useClient } from '../../../auth/hooks';

const T_PATH = 'components.common.navbar.Navbar';

const NavBar = (): JSX.Element => {
  const client = useClient();
  const authenticated = client.isAuthenticated();
  const initialized = client.isInitialized();
  const { t, i18n } = useTranslation();

  const languages: LanguageOption[] = [
    { label: 'Suomi', value: 'fi', isPrimary: true },
    { label: 'English', value: 'en', isPrimary: true },
  ];

  const languageChangedStateAction = (code: string) => {
    i18n.changeLanguage(code);
  };

  return (
    <Header onDidChangeLanguage={languageChangedStateAction} languages={languages}>
      <Header.ActionBar
        frontPageLabel={t(`${T_PATH}.title`)}
        title={t(`${T_PATH}.title`)}
        titleAriaLabel={t(`${T_PATH}.title`)}
        titleHref="/"
        logo={<Logo src={logoFi} alt="City of Helsinki" />}
        logoAriaLabel={t(`${T_PATH}.title`)}
      >
        <Header.SimpleLanguageOptions languages={[languages[0], languages[1]]} />

        {initialized && !authenticated && (
          <Header.ActionBarButton fixedRightPosition icon={<IconSignin />} onClick={(): void => client?.login()} />
        )}

        {initialized && authenticated && (
          <Header.ActionBarButton
            label={t(`${T_PATH}.logout`)}
            fixedRightPosition
            icon={<IconSignout />}
            onClick={(): void => client?.logout()}
          />
        )}
      </Header.ActionBar>
    </Header>
  );
};

export default NavBar;
