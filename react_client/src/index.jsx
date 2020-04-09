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
      clientNfcValues: Array(8).fill(0),
      clientNfcToUpdate: -1,
      audioPlayer: null,
      backendHasSpotifyCreds: null,
      spotifyWasPlaying: false,
      nfcCurrentlyPlaying: {},
    };

    this.updateClientState = this.updateClientState.bind(this);
    this.sendTracksToStacks = this.sendTracksToStacks.bind(this);
    this.setNfcClientToUpdate = this.setNfcClientToUpdate.bind(this);
  }

  componentDidMount() {
    this.getClientList();
    this.getSpotifyCredsStatus();

    client.onopen = () => {
      console.log('WS connected.');
    };

    client.onmessage = (message) => {
      const { clientState, audioPlayer, clientNfcToUpdate } = this.state;
      const jsonMessage = JSON.parse(message.data);
      console.log(jsonMessage);

      if ('focus' in jsonMessage) {
        if (jsonMessage.focus) {
          const spotifyPayload = clientState[jsonMessage.id];
          this.setState({ activeImageUrl: (spotifyPayload != null) ? spotifyPayload.album.images[0].url : '' });

          if (audioPlayer == null && spotifyPayload != null && clientNfcToUpdate === -1) {
            fetch(`http://${host}:8002/spotify/is-playing`)
              .then((res) => res.json())
              .then((res) => { setTimeout(() => { this.startPreview(spotifyPayload.preview_url, res); }, res ? 2000 : 0); });
          }
        } else {
          this.setState({ activeImageUrl: null });

          if (audioPlayer != null) {
            this.fadeOutAudioPlayer();
          }
        }
      } else if ('nfc' in jsonMessage) {
        const { nfc } = jsonMessage;
        const { clientNfcValues, nfcCurrentlyPlaying } = this.state;

        // update value if necessary
        this.updateNfcValue(nfc);

        // ignore if same tag is reported
        if (nfc !== nfcCurrentlyPlaying.nfc) {
          const json = { nfc, id: clientNfcValues.indexOf(nfc) };
          this.setState({ nfcCurrentlyPlaying: json });
          const { uri } = clientState[clientNfcValues.indexOf(nfc)];

          fetch(`http://${host}:8002/spotify/play/track?trackUri=${uri}`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
          });
        }
      }
    };
  }

  setNfcClientToUpdate(index) {
    this.setState({ clientNfcToUpdate: index });
  }

  getClientList() {
    fetch(`http://${host}:8002/client/list`)
      .then((res) => res.json())
      .then((res) => this.setState({ clientList: res }));
  }

  getSpotifyCredsStatus() {
    fetch(`http://${host}:8002/spotify/has-credentials`)
      .then((res) => res.json())
      .then((res) => this.setState({ backendHasSpotifyCreds: res }));
  }

  startPreview(previewUrl, spotifyWasPlaying) {
    const previewPlayer = new Audio(previewUrl);
    previewPlayer.play();
    this.setState({ audioPlayer: previewPlayer });

    if (spotifyWasPlaying) {
      this.setState({ spotifyWasPlaying: true });
      fetch(`http://${host}:8002/spotify/control?command=pause`, { method: 'POST' });
    }

    this.fadeInAudioPlayer();
  }

  fadeInAudioPlayer() {
    const { audioPlayer } = this.state;

    audioPlayer.volume = 0.05;
    const fadeAudio = setInterval(() => {
      if (audioPlayer.volume < 0.9) {
        audioPlayer.volume += 0.1;
      } else {
        clearInterval(fadeAudio);
      }
    }, 100);
  }

  fadeOutAudioPlayer() {
    const { audioPlayer, spotifyWasPlaying } = this.state;

    const fadeAudio = setInterval(() => {
      if (audioPlayer.volume > 0.1) {
        audioPlayer.volume -= 0.1;
      } else {
        clearInterval(fadeAudio);

        audioPlayer.pause();
        this.setState({ audioPlayer: null });
      }
    }, 30);

    if (spotifyWasPlaying) {
      fetch(`http://${host}:8002/spotify/control?command=play`, { method: 'POST' });
    }
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
    this.setState({ clientState });
  }

  updateNfcValue(input) {
    const { clientNfcToUpdate, clientNfcValues } = this.state;

    if (clientNfcToUpdate >= 0) {
      clientNfcValues[clientNfcToUpdate] = input;
      this.setState({ clientNfcToUpdate: -1 });
    }
  }

  returnCredsButton() {
    return <button type="button" onClick={() => window.open(`http://${host}:8002/spotify/authorise`, '_self')}>Add Credentials</button>;
  }

  renderGroup(name) {
    return <Group name={name} sendToStacks={this.sendImagesToStacks} />;
  }

  renderActive() {
    const { activeImageUrl } = this.state;
    return <Active activeImageUrl={activeImageUrl}> </Active>;
  }

  renderStack(i) {
    return <Stack index={i} updateUrlState={this.updateUrlState} setNfcClientToUpdate={this.setNfcClientToUpdate} />;
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

    const { backendHasSpotifyCreds } = this.state;
    const addCredsButton = !backendHasSpotifyCreds ? this.returnCredsButton() : null;

    return (
      <div className="App">
        <h1>client_controller</h1>

        <div style={{ height: 240, width: 240, margin: '20px' }}>
          {active}
        </div>

        <div style={{ margin: '20px' }}>
          {stacks}

          <h2>group_send</h2>
          <p>{groups}</p>

          <h2>spotify</h2>
          <p>{spotify}</p>

          {addCredsButton}
        </div>
      </div>
    );
  }
}

export default App;

ReactDOM.render(
  <App />,
  document.getElementById('root'),
);
