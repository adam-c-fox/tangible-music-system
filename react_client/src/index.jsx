/* eslint-disable class-methods-use-this */
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
      clientState: Array(8).fill(null),
      activeImageUrl: '',
    };

    this.updateClientState = this.updateClientState.bind(this);
    this.sendTracksToStacks = this.sendTracksToStacks.bind(this);
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

      const { clientState } = this.state;
      if (jsonMessage.focus) {
        const spotifyPayload = clientState[jsonMessage.id];
        this.setState({ activeImageUrl: spotifyPayload.album.images[0].url });
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

  sendTracksToStacks(list) {
    const { clientList } = this.state;

    // Choose a random track from the payload to send to each stack
    clientList.forEach((element) => {
      const index = Math.floor(Math.random() * (list.length - 1));
      const spotifyPayload = list[index];
      list.splice(index, 1);

      console.log(`${element}: ${spotifyPayload.name}`);

      // Send text
      this.clearStackText(element);
      this.sendTextToStack(element, 10, 250, spotifyPayload.name);
      this.sendTextToStack(element, 10, 265, spotifyPayload.album.name);
      this.sendTextToStack(element, 10, 280, spotifyPayload.artists[0].name);

      // Convert and send image
      fetch(`http://${host}:8002/convert/jpeg-to-png?jpegUrl=${spotifyPayload.album.images[0].url}`, { method: 'POST' })
        .then((res) => res.json())
        .then((res) => this.sendImageToStack(element, 0, 0, res));

      this.updateClientState(element, spotifyPayload);
    });
  }

  clearStackText(id) {
    fetch(`http://${host}:8002/send/clear?ID=${id}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

  sendTextToStack(id, x, y, text) {
    const bodyString = `ID=${id}&text=${text}&x=${x}&y=${y}`;

    fetch(`http://${host}:8002/send/text?${bodyString}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

  sendImageToStack(id, x, y, pngUrl) {
    const bodyString = `ID=${id}&pngUrl=${pngUrl}&x=${x}&y=${y}`;

    fetch(`http://${host}:8002/send/image?${bodyString}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

  updateClientState(i, stateObj) {
    const { clientState } = this.state;
    clientState[i] = stateObj;
    this.setState({ clientState: clientState });
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
    return <Spotify sendToStacks={this.sendTracksToStacks} />;
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
