// @flow
import * as React from "react";
import TitleBar from "../components/TitleBar";

type Props = {
  children: React.Node
};

export default class App extends React.Component<Props> {
  props: Props;

  render() {
    return (
      <div>
        <TitleBar />
        {this.props.children}
      </div>
    );
  }
}
