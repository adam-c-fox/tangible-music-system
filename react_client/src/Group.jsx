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
    xmlhttp.open('GET', `http://192.168.0.14:5001/images/${name}/manifest.txt`, true);
    xmlhttp.send();

    this.setState({ request: xmlhttp });
  }

  handleLoad() {
    const { request } = this.state;
    const { clientList, updateUrlState } = this.props;
    const imageList = request.response.split('\n');

    clientList.forEach((element) => {
      const index = Math.floor(Math.random() * (imageList.length - 1));
      const url = imageList[index];
      imageList.splice(index, 1);

      console.log(`${element}: ${url}`);

      const bodyString = `ID=${element}&pngUrl=${url}&x=40&y=0`;
      fetch(`http://127.0.0.1:8002/send/image?${bodyString}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      updateUrlState(element, url);
    });
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
  updateUrlState: PropTypes.func.isRequired,
  clientList: PropTypes.arrayOf(PropTypes.number).isRequired,
};
