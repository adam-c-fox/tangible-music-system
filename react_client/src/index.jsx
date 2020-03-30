import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { w3cwebsocket as W3CWebSocket } from 'websocket';
import Active from './Active';
import Group from './Group';
import Stack from './Stack';
import Spotify from './Spotify';

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
    this.sendImagesToStacks = this.sendImagesToStacks.bind(this);
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

  sendImagesToStacks(list) {
    const { clientList } = this.state;

    clientList.forEach((element) => {
      const index = Math.floor(Math.random() * (list.length - 1));
      const url = list[index];
      list.splice(index, 1);

      console.log(`${element}: ${url}`);

      const bodyString = `ID=${element}&pngUrl=${url}&x=80&y=0`;
      fetch(`http://127.0.0.1:8002/send/image?${bodyString}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      this.updateUrlState(element, url);
    });
  }

  updateUrlState(i, url) {
    const state = this.state.urlState;
    state[i] = url;
    this.setState({ urlState: state });
  }

  renderGroup(name, clientList) {
    return <Group name={name} sendToStacks={this.sendImagesToStacks} />;
  }

  renderActive() {
    const { activeImageUrl } = this.state;
    return <Active activeImageUrl={activeImageUrl}> </Active>;
  }

  renderStack(i) {
    return <Stack index={i} updateUrlState={this.updateUrlState} />;
  }

  renderSpotify() {
    return <Spotify sendToStacks={this.sendImagesToStacks} />;
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
    const spotify = this.renderSpotify();

    return (
      <div className="App">
        <h1>client_controller</h1>
        <p>{active}</p>
        <p>{stacks}</p>

        <h2>group_send</h2>
        <p>{groups}</p>

        <h2>spotify</h2>
        <p>{spotify}</p>
      </div>
    );
  }
}

export default App;

ReactDOM.render(
  <App />,
  document.getElementById('root'),
);
