import { Header, LanguageOption, Logo, WithAuthentication, logoFi, useOidcClient } from 'hds-react';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '../../../enums';
import { useGetMessagesInboxSummaryQuery } from '../../../redux/services/api';
import Login from '../auth/Login';
import Logout from '../auth/Logout';

const T_PATH = 'components.common.navbar.Navbar';

const NavBar = (): JSX.Element => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useOidcClient();
  const isUserAuthenticated = isAuthenticated();

  const { data: inboxSummary } = useGetMessagesInboxSummaryQuery(undefined, {
    skip: !isUserAuthenticated,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const unreadTotal = inboxSummary?.total_unread || 0;

  const messagesBaseLabel = t(`${T_PATH}.messages`);
  let messagesLabel = messagesBaseLabel;
  if (unreadTotal > 0) {
    const unreadLabel = unreadTotal > 99 ? '99+' : String(unreadTotal);
    messagesLabel = `${messagesBaseLabel} (${unreadLabel})`;
  }

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

      {isUserAuthenticated && (
        <Header.NavigationMenu>
          <Header.Link href={`/${ROUTES.PROJECTS}`} label={t(`${T_PATH}.projects`)} />
          <Header.Link href={`/${ROUTES.CUSTOMERS}`} label={t(`${T_PATH}.customers`)} />
          <Header.Link href={`/${ROUTES.MESSAGES}`} label={messagesLabel} />
          <Header.Link href={`/${ROUTES.REPORTS}`} label={t(`${T_PATH}.reports`)} />
        </Header.NavigationMenu>
      )}
    </Header>
  );
};

export default NavBar;
