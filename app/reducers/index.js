// @flow
import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import app from './app';
import files from './files';
import whiteboard from './whiteboard';

const rootReducer = combineReducers({
  router,
  app,
  files,
  whiteboard,
});

export default rootReducer;
