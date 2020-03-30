import React, { Component } from 'react';
import PropTypes from 'prop-types';
export const host = '192.168.1.33';
const spotifyPayloadSize = 20;

export default class Spotify extends Component {
  constructor(props) {
    super(props);
    this.state = {
      topTracksResponse: [],
      tracksToSend: [],
    };

    this.topTracksOnClick = this.topTracksOnClick.bind(this);
  }

  topTracksOnClick() {
    fetch(`http://${host}:8002/spotify/top-tracks`)
      .then((res) => res.json())
      .then((res) => this.sendTopTracks(res));
  }

  sendTopTracks(tracks) {
    this.setState({ topTracksResponse: tracks });

    tracks.forEach((element) => {
      fetch(`http://${host}:8002/convert/jpeg-to-png?jpegUrl=${element.album.images[0].url}`, { method: 'POST' })
        .then((res) => res.json())
        .then((res) => this.pushTrack(res));
    });
  }

  pushTrack(track) {
    const { sendToStacks } = this.props;
    const { tracksToSend } = this.state;

    tracksToSend.push(track);

    if (tracksToSend.length === spotifyPayloadSize) {
      sendToStacks(tracksToSend);
      this.setState({ tracksToSend: [] });
    } else {
      this.setState({ tracksToSend: tracksToSend });
    }
  }

  renderTrack(element) {
    return <li>{element.name}</li>;
  }

  render() {
    const tracks = [];
    const { topTracksResponse } = this.state;
    topTracksResponse.forEach((element) => tracks.push(this.renderTrack(element)));

    return (
      <div className="spotify">
        <button type="button" onClick={this.topTracksOnClick}>Top Tracks</button>

        <ul>
          {tracks}
        </ul>
      </div>
    );
  }
}

Spotify.propTypes = {
  sendToStacks: PropTypes.func.isRequired,
};
