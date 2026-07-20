import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import { chromeStorage } from './persist';

import playerReducer from './slices/playerSlice';
import queueReducer from './slices/queueSlice';
import searchReducer from './slices/searchSlice';
import libraryReducer from './slices/librarySlice';
import userReducer from './slices/userSlice';

const persistConfig = {
  key: 'melo_root',
  version: 1,
  storage: chromeStorage,
  whitelist: ['player', 'queue', 'library', 'user'], // We might not want to persist search results
};

const rootReducer = combineReducers({
  player: playerReducer,
  queue: queueReducer,
  search: searchReducer,
  library: libraryReducer,
  user: userReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
