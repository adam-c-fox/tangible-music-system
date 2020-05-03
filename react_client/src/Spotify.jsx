/* eslint-disable import/no-cycle */
/* eslint-disable class-methods-use-this */
import React, { Component } from 'react';
import { host, logicPort } from '.';

export default class Spotify extends Component {
  constructor(props) {
    super(props);
    this.state = {
      artistName: '',
    };

    this.topTracksOnClick = this.topTracksOnClick.bind(this);
    this.artistOnChange = this.artistOnChange.bind(this);
    this.artistOnSubmit = this.artistOnSubmit.bind(this);
  }

  topTracksOnClick() {
    fetch(`http://${host}:${logicPort}/spotify/send/top-tracks`);
  }

  similarToNowPlaying() {
    fetch(`http://${host}:${logicPort}/spotify/send/similar-to-now-playing`);
  }

  somethingDifferent() {
    fetch(`http://${host}:${logicPort}/spotify/send/something-different`);
  }

  myPlaylists() {
    fetch(`http://${host}:${logicPort}/spotify/send/my-playlists`);
  }

  artistOnChange(event) {
    this.setState({ artistName: event.target.value });
  }

  artistOnSubmit(event) {
    event.preventDefault();
    const { artistName } = this.state;
    fetch(`http://${host}:${logicPort}/spotify/send/artist-top-tracks?artistName=${artistName}`);
  }

  renderTrack(element) {
    return <li>{element.name}</li>;
  }

  render() {
    return (
      <div className="spotify">
        <button type="button" onClick={this.topTracksOnClick}>Top Tracks</button>
        <button type="button" onClick={this.similarToNowPlaying}>Similar to now playing</button>
        <button type="button" onClick={this.somethingDifferent}>Show me something different</button>
        <button type="button" onClick={this.myPlaylists}>My Playlists</button>

        <form onSubmit={this.artistOnSubmit}>
          Search Artist
          <input type="text" name="artist" onChange={this.artistOnChange} size="60"/>
          <input type="submit" value="Submit" />
        </form>

      </div>
    );
  }
}
