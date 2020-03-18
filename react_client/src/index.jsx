import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { w3cwebsocket as W3CWebSocket } from 'websocket';
import Active from './Active';
import Group from './Group';
import Stack from './Stack';

export const host = 'localhost';
export const client = new W3CWebSocket(`ws://${host}:8001`);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      clientList: [],
      urlState: Array(8).fill(null),
      activeImageUrl: '',
    };

    this.updateUrlState = this.updateUrlState.bind(this);
  }

  componentDidMount() {
    this.getClientList();

    client.onopen = () => {
      console.log('WS connected.');
    };

    client.onmessage = (message) => {
      console.log(message);

      const jsonMessage = JSON.parse(message.data);
      console.log(jsonMessage);

      const { urlState } = this.state;
      if (jsonMessage.focus) {
        const url = urlState[jsonMessage.id];
        this.setState({ activeImageUrl: url });
      } else {
        this.setState({ activeImageUrl: null });
      }
    };
  }

  getClientList() {
    fetch(`http://${host}:8002/client/list`)
      .then((res) => res.json())
      .then((res) => this.setState({ clientList: res }));
  }

  updateUrlState(i, url) {
    const state = this.state.urlState;
    state[i] = url;
    this.setState({ urlState: state });
  }

  renderGroup(name, clientList) {
    return <Group name={name} clientList={clientList} updateUrlState={this.updateUrlState} />;
  }

  renderActive() {
    const { activeImageUrl } = this.state;
    return <Active activeImageUrl={activeImageUrl}> </Active>;
  }

  renderStack(i) {
    return <Stack index={i} updateUrlState={this.updateUrlState} />;
  }

  render() {
    const stacks = [];
    const { clientList } = this.state;
    clientList.forEach((element) => stacks.push(this.renderStack(element)));

    const groups = [
      this.renderGroup('80s', clientList),
      this.renderGroup('prog_rock', clientList),
      this.renderGroup('top_songs_2019', clientList),
    ];
    const active = this.renderActive();

    return (
      <div className="App">
        <h1>client_controller</h1>
        <p>{active}</p>
        <p>{stacks}</p>

        <h2>group_send</h2>
        <p>{groups}</p>
      </div>
    );
  }
}

export default App;

ReactDOM.render(
  <App />,
  document.getElementById('root'),
);
