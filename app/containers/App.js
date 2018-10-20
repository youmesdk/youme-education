import React, { Component } from 'react'
import { Switch, Route } from 'react-router'
import Index from '../components/Index'
import Room from '../components/Room'
import DeviceCheck from '../components/DeviceCheck'

export default class App extends Component {
  render() {
    return (
      <div style={{ height: '100%' }}>
        <Switch>
          <Route exact path="/" component={Index} />
          <Route path="/room" component={Room} />
          <Route path="/devicecheck" component={DeviceCheck} />
        </Switch>
      </div>
    )
  }
}
