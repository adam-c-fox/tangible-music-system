/* eslint-disable import/no-cycle */
/* eslint-disable class-methods-use-this */
import React, { Component } from 'react';
import { host, logicPort } from '.';

export default class Spotify extends Component {
  constructor(props) {
    super(props);

    this.topTracksOnClick = this.topTracksOnClick.bind(this);
  }

  topTracksOnClick() {
    fetch(`http://${host}:${logicPort}/spotify/send/top-tracks`);
  }

  renderTrack(element) {
    return <li>{element.name}</li>;
  }

  render() {
    return (
      <div className="spotify">
        <button type="button" onClick={this.topTracksOnClick}>Top Tracks</button>
      </div>
    );
  }
}