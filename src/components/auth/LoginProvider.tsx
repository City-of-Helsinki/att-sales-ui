import { LoginProvider } from 'hds-react';
import React, { FC } from 'react';

import { getHDSClientConfig } from '../../auth';

interface HDSLoginProviderProps {
  children: React.ReactNode;
}

const HDSLoginProvider: FC<HDSLoginProviderProps> = ({ children }) => {
  const loginProviderProps = getHDSClientConfig();

  return <LoginProvider {...loginProviderProps}>{children}</LoginProvider>;
};

export default HDSLoginProvider;
