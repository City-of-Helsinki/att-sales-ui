import React from 'react';
import { IconSignout, Navigation } from 'hds-react';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import useLocalStorage from '../../../utils/useLocalStorage';
import { ROUTES } from '../../../enums';
import { useClient } from '../../../auth/hooks';
import { LOCALSTORAGE_LANG_KEY } from '../../../i18n/i18n';

import styles from './Navbar.module.scss';

const T_PATH = 'components.common.navbar.Navbar';
const LANGUAGES = ['fi', 'en'];

const isActiveLink = (path: string, currentPath: string): boolean => !!matchPath({ path, end: false }, currentPath);

const NavBar = (): JSX.Element => {
  const client = useClient();
  const authenticated = client.isAuthenticated();
  const initialized = client.isInitialized();
  const user = client.getUser();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [language, setLang] = useLocalStorage({
    defaultValue: LANGUAGES[0],
    key: LOCALSTORAGE_LANG_KEY,
  });

  const setLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setLang(code);
  };

  const navLinks = [
    {
      path: `/${ROUTES.PROJECTS}`,
      label: t(`${T_PATH}.projects`),
    },
    {
      path: `/${ROUTES.CUSTOMERS}`,
      label: t(`${T_PATH}.customers`),
    },
    {
      path: `/${ROUTES.REPORTS}`,
      label: t(`${T_PATH}.reports`),
    },
  ];

  return (
    <Navigation
      menuToggleAriaLabel="menu"
      title={t(`${T_PATH}.title`)}
      skipTo="#mainContent"
      skipToContentLabel={t(`${T_PATH}.skipToContent`)}
      className={styles.navbar}
      onTitleClick={() => navigate(ROUTES.INDEX)}
    >
      <Navigation.Actions>
        <Navigation.LanguageSelector label={language.toUpperCase()}>
          {LANGUAGES.map((lang) => (
            <Navigation.Item
              key={lang}
              label={t(`${T_PATH}.lang.${lang}`)}
              lang={lang}
              onClick={(): void => setLanguage(lang)}
            />
          ))}
        </Navigation.LanguageSelector>
        {initialized && (
          <Navigation.User
            authenticated={authenticated}
            label={t(`${T_PATH}.login`)}
            onSignIn={(): void => client.login()}
            userName={user ? user.given_name : ''}
          >
            <Navigation.Item
              onClick={(): void => client.logout()}
              variant="supplementary"
              label={t(`${T_PATH}.logout`)}
              href={`/${ROUTES.LOGOUT}`}
              icon={<IconSignout aria-hidden />}
            />
          </Navigation.User>
        )}
      </Navigation.Actions>
      {initialized && authenticated && (
        <Navigation.Row>
          {navLinks.map(({ path, label }) => (
            <Navigation.Item
              key={path}
              label={label}
              active={isActiveLink(path, location.pathname)}
              onClick={() => navigate(path)}
            />
          ))}
        </Navigation.Row>
      )}
    </Navigation>
  );
};

export default NavBar;
