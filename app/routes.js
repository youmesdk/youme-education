/* eslint flowtype-errors/show-errors: 0 */
import React from 'react';
import { Switch, Route } from 'react-router';
import App from './containers/App';
import IndexPage from './containers/IndexPage';
import TitleBar from './components/TitleBar';

export default () => (
  <App>
    <header className="title">
      <TitleBar />
    </header>
    <Switch>
      <Route path="/" component={IndexPage} />
    </Switch>
  </App>
);
