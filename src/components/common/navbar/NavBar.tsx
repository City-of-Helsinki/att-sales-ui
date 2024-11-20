import React from 'react';
import { Header, Logo, logoFi, LanguageOption, WithAuthentication, useOidcClient } from 'hds-react';
import { useTranslation } from 'react-i18next';

import Login from '../auth/Login';
import Logout from '../auth/Logout';
import { ROUTES } from '../../../enums';

const T_PATH = 'components.common.navbar.Navbar';

const NavBar = (): JSX.Element => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useOidcClient();

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

        <WithAuthentication AuthorisedComponent={Logout} UnauthorisedComponent={Login} />
      </Header.ActionBar>

      {isAuthenticated() && (
        <Header.NavigationMenu>
          <Header.Link href={`/${ROUTES.PROJECTS}`} label={t(`${T_PATH}.projects`)} />
          <Header.Link href={`/${ROUTES.CUSTOMERS}`} label={t(`${T_PATH}.customers`)} />
          <Header.Link href={`/${ROUTES.REPORTS}`} label={t(`${T_PATH}.reports`)} />
        </Header.NavigationMenu>
      )}
    </Header>
  );
};

export default NavBar;
