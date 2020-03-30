import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class Group extends Component {
  constructor(props) {
    super(props);
    this.state = {
      request: null,
    };

    this.onButtonClick = this.onButtonClick.bind(this);
    this.handleLoad = this.handleLoad.bind(this);
  }

  onButtonClick() {
    const { name } = this.props;
    const xmlhttp = new XMLHttpRequest();
    xmlhttp.addEventListener('load', this.handleLoad);
    xmlhttp.open('GET', `http://192.168.1.33:5001/images/${name}/manifest.txt`, true);
    xmlhttp.send();

    this.setState({ request: xmlhttp });
  }

  handleLoad() {
    const { request } = this.state;
    const { sendToStacks } = this.props;

    const imageList = request.response.split('\n');
    sendToStacks(imageList);
  }

  render() {
    const { name } = this.props;

    return (
      <div className="group">
        <button type="button" onClick={this.onButtonClick}>{name}</button>
      </div>
    );
  }
}

Group.propTypes = {
  name: PropTypes.string.isRequired,
  sendToStacks: PropTypes.func.isRequired,
};
