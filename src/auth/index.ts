import { LoginProviderProps } from 'hds-react';

export type User = Record<string, string | number | boolean>;
export type Token = string | undefined;
export type JWTPayload = Record<string, string>;

export const ClientStatus = {
  NONE: 'NONE',
  INITIALIZING: 'INITIALIZING',
  AUTHORIZED: 'AUTHORIZED',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

export type ClientStatusId = typeof ClientStatus[keyof typeof ClientStatus];

export type ClientErrorObject = { type: string; message: string } | undefined;

const configUrl = String(process.env[`REACT_APP_OIDC_URL`]);
const configRealm = String(process.env[`REACT_APP_OIDC_REALM`]);
const configTokenExchangeUrl = String(process.env[`REACT_APP_OIDC_TOKEN_EXCHANGE_URL`]);

const HDSLoginConfig: LoginProviderProps = {
  userManagerSettings: {
    authority: configRealm ? `${configUrl}/realms/${configRealm}` : configUrl,
    client_id: String(process.env[`REACT_APP_OIDC_CLIENT_ID`]),
    scope: process.env[`REACT_APP_OIDC_SCOPE`],
    redirect_uri: getLocationBasedUri(String(process.env[`REACT_APP_OIDC_CALLBACK_PATH`])),
    silent_redirect_uri: getLocationBasedUri(process.env[`REACT_APP_OIDC_SILENT_AUTH_PATH`]),
    automaticSilentRenew: true,
    response_type: process.env[`REACT_APP_OIDC_RESPONSE_TYPE`],
    post_logout_redirect_uri: getLocationBasedUri(process.env[`REACT_APP_OIDC_LOGOUT_PATH`] || '/'),
  },
  apiTokensClientSettings: {
    url: configTokenExchangeUrl,
    queryProps: {
      grantType: String(process.env[`REACT_APP_API_GRANT_TYPE`]),
      permission: '#access',
    },
    audiences: [String(process.env.REACT_APP_API_AUDIENCE)],
    maxRetries: 10,
    retryInterval: 1000,
  },
  sessionPollerSettings: { pollIntervalInMs: 10000 },
};

export function isCallbackUrl(route: string): boolean {
  return route === String(process.env[`REACT_APP_OIDC_CALLBACK_PATH`]);
}

export function getHDSClientConfig(): LoginProviderProps {
  return HDSLoginConfig;
}

export function getLocationBasedUri(property: string | undefined): string | undefined {
  const location = window.location.origin;
  if (property === undefined) {
    return undefined;
  }
  return `${location}${property}`;
}
