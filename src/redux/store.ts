import { configureStore, combineReducers, ThunkAction, Action } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import type { PreloadedState } from '@reduxjs/toolkit';

import authReducer from './features/authSlice';
import apiTokenReducer from './features/apiTokenSlice';
import offerModalReducer from './features/offerModalSlice';
import { api } from './services/api';
import { rtkQueryErrorLogger } from './middleware/error';

const rootReducer = combineReducers({
  tokens: apiTokenReducer,
  auth: authReducer,
  offerModal: offerModalReducer,
  [api.reducerPath]: api.reducer,
});

export const setupStore = (preloadedState?: PreloadedState<RootState>) => {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware, rtkQueryErrorLogger),
    preloadedState,
  });
};

export const store = setupStore();

setupListeners(store.dispatch);

export type AppDispatch = AppStore['dispatch'];
export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof setupStore>;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;
