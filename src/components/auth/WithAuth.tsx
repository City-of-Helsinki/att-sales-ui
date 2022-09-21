import React, { useContext } from 'react';

import i18n from '../../i18n/i18n';
import IdleTimer from './WithIdleProvider';
import { ApiAccessTokenActions } from '../../api/useApiAccessTokens';
import { ApiAccessTokenContext } from '../api/ApiAccessTokenProvider';
import { Client } from '../../auth/index';
import { apiTokenFetched } from '../../redux/features/apiTokenSlice';
import { getApiTokenByAudience } from '../../utils/getApiTokenByAudience';
import { store } from '../../redux/store';
import { toast } from '../common/toast/ToastManager';
import { useClient } from '../../auth/hooks';

export type WithAuthChildProps = { client: Client };

const WithAuth = (
  AuthorizedContent: React.ComponentType<WithAuthChildProps>,
  UnAuthorizedContent: React.ComponentType<WithAuthChildProps>,
  InitializingContent?: React.ComponentType<unknown>
): React.ReactElement => {
  const { getTokens, getStatus } = useContext(ApiAccessTokenContext) as ApiAccessTokenActions;
  const client = useClient();
  const isInitialized = client.isInitialized();
  const authenticated = client.isAuthenticated();
  const apiTokenStatus = getStatus();
  const apiTokens = getTokens();
  const apiToken = getApiTokenByAudience(apiTokens);

  if (apiTokenStatus === 'error') {
    // Show error toast when error in loading api tokens
    toast.show({
      type: 'error',
      title: i18n.t('error.apiTokenLoad'),
      content: i18n.t('error.automaticLogoutMessage'),
      showAsModal: true,
      onCloseActions: () => client.logout(), // Log out the user automatically when toast closes
    });
    return <UnAuthorizedContent client={client} />;
  }

  if (InitializingContent && (!isInitialized || apiTokenStatus === 'loading')) {
    return <InitializingContent />;
  }

  if (authenticated) {
    if (apiToken && apiTokenStatus === 'loaded') {
      store.dispatch(apiTokenFetched({ apiToken }));
      return (
        <IdleTimer>
          <AuthorizedContent client={client} />
        </IdleTimer>
      );
    }
    if (InitializingContent) {
      return <InitializingContent />;
    }
  }

  return <UnAuthorizedContent client={client} />;
};

export default WithAuth;
