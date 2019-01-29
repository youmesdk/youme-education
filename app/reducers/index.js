// @flow
import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import app from './app';
import files from './files';

const rootReducer = combineReducers({
  router,
  app,
  files,
});

export default rootReducer;
