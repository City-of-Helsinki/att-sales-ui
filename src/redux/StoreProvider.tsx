import React, { FC } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';

const StoreProvider: FC<React.PropsWithChildren<unknown>> = ({ children }) => {
  return <Provider store={store}>{children}</Provider>;
};

export default StoreProvider;
