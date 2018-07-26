// @flow
import React, { Component } from "react";
import TitleBar from "../components/TitleBar";
import { Switch, Route } from "react-router";
import Index from "../components/Index";
import Room from "../components/Room";
import Register from "../components/Register";

export default class App extends React.Component {
  render() {
    return (
      <div>
        <header>
          <TitleBar />
        </header>
        <Switch>
          <Route path="/room" component={Room} />
          <Route path="/register" component={Register} />
          <Route path="/" component={Index} />
        </Switch>
      </div>
    );
  }
}
