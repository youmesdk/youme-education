import React, { Component } from 'react'
import { Switch, Route } from 'react-router'
import Index from '../components/Index'
import Room from '../components/Room'
import DeviceCheck from '../components/DeviceCheck'

type Props = {}

export default class App extends Component<Props> {
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
