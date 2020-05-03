/* eslint-disable class-methods-use-this */
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { w3cwebsocket as W3CWebSocket } from 'websocket';
import Active from './Active';
import Group from './Group';
import Stack from './Stack';
import Spotify from './Spotify';

export const host = 'localhost';
// export const host = '3.23.30.117';
export const client = new W3CWebSocket(`ws://${host}:8001`);
export const clientControllerPort = 8002;
export const logicPort = 8003;
export const spotifyPort = 8004;
export const utilsPort = 8005;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      clientList: [],
      clientState: new Map(),
      activeImageUrl: '',
      audioPlayer: null,
      backendHasSpotifyCreds: null,
      spotifyWasPlaying: false,
      nfcCurrentlyPlaying: '',
      nfcCurrentlyPlayingTimeout: null,
    };

    this.updateClientState = this.updateClientState.bind(this);
  }

  componentDidMount() {
    this.getClientList();
    this.getSpotifyCredsStatus();

    client.onopen = () => {
      console.log('WS connected.');
    };

    client.onmessage = (message) => {
      const { clientState, audioPlayer } = this.state;
      const jsonMessage = JSON.parse(message.data);
      console.log(jsonMessage);

      if ('focus' in jsonMessage) {
        if (jsonMessage.focus) {
          const spotifyPayload = clientState.get(jsonMessage.mac);

          // (Album|Playlist) URL
          let url = '';
          if (spotifyPayload != null) {
            url = this.isPlaylist(spotifyPayload) ? spotifyPayload.images[0].url : spotifyPayload.album.images[0].url;
          }
          this.setState({ activeImageUrl: url });

          if (audioPlayer == null && spotifyPayload != null && !this.isMacCurrentlyPlaying(jsonMessage.mac)) {
            fetch(`http://${host}:${spotifyPort}/spotify/is-playing`)
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
        const { nfcCurrentlyPlaying, nfcCurrentlyPlayingTimeout } = this.state;

        // ignore if same tag is reported
        if (nfc !== nfcCurrentlyPlaying) {
          this.setState({ nfcCurrentlyPlaying: nfc });
          const { uri } = clientState.get(nfc);

          const timeout = setTimeout(() => this.nfcSpotifyTimeoutHandler(), 3000);
          this.setState({ nfcCurrentlyPlayingTimeout: timeout });

          if (this.isPlaylist(clientState.get(nfc))) {
            fetch(`http://${host}:${spotifyPort}/spotify/play/playlist?playlistUri=${uri}`, {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
            });
          } else {
            fetch(`http://${host}:${spotifyPort}/spotify/play/track?trackUri=${uri}`, {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
            });
          }
        } else {
          // if same tag is reported, reset timeout
          clearTimeout(nfcCurrentlyPlayingTimeout);
          const timeout = setTimeout(() => this.nfcSpotifyTimeoutHandler(), 3000);
          this.setState({ nfcCurrentlyPlayingTimeout: timeout });
        }
      } else if ('mac' in jsonMessage && 'spotifyPayload' in jsonMessage) {
        const { mac, spotifyPayload } = jsonMessage;
        this.updateClientState(mac, spotifyPayload);
      }
    };
  }

  getClientList() {
    fetch(`http://${host}:${clientControllerPort}/client/list`)
      .then((res) => res.json())
      .then((res) => this.setState({ clientList: res }));
  }

  getSpotifyCredsStatus() {
    fetch(`http://${host}:${spotifyPort}/spotify/has-credentials`)
      .then((res) => res.json())
      .then((res) => this.setState({ backendHasSpotifyCreds: res }));
  }

  nfcSpotifyTimeoutHandler() {
    this.setState({ nfcCurrentlyPlaying: '' });
    fetch(`http://${host}:${spotifyPort}/spotify/control?command=pause`, { method: 'POST' });
  }

  isMacCurrentlyPlaying(mac) {
    const { nfcCurrentlyPlaying } = this.state;
    return (nfcCurrentlyPlaying === mac);
  }

  isPlaylist(spotifyPayload) {
    return ('collaborative' in spotifyPayload);
  }

  startPreview(previewUrl, spotifyWasPlaying) {
    // Don't start preview if stack is no longer active
    const { activeImageUrl } = this.state;
    if (activeImageUrl === null) { return; }

    const previewPlayer = new Audio(previewUrl);
    previewPlayer.play();
    this.setState({ audioPlayer: previewPlayer });

    if (spotifyWasPlaying) {
      this.setState({ spotifyWasPlaying: true });
      fetch(`http://${host}:${spotifyPort}/spotify/control?command=pause`, { method: 'POST' });
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
      fetch(`http://${host}:${spotifyPort}/spotify/control?command=play`, { method: 'POST' });
    }
  }

  updateClientState(i, stateObj) {
    const { clientState } = this.state;
    clientState.set(i, stateObj);
    this.setState({ clientState });
  }

  returnCredsButton() {
    return <button type="button" onClick={() => window.open(`http://${host}:${spotifyPort}/spotify/authorise`, '_self')}>Add Credentials</button>;
  }

  renderGroup(name) {
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
    clientList.forEach((element) => stacks.push(this.renderStack(element[0])));

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
        </div>

        <div style={{ margin: '20px', clear: 'both' }}>
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
