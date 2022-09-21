import { JWTPayload } from '../auth';

export const getApiTokenByAudience = (apiTokens?: JWTPayload) => {
  return apiTokens ? apiTokens[String(process.env.REACT_APP_API_AUDIENCE)] : undefined;
};
