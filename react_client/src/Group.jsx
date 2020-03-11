import React, { Component } from 'react';

export default class Group extends Component {
  constructor(props) {
    super(props);
    this.state = {
      request: null,
    };

    this.onButtonClick = this.onButtonClick.bind(this);
    this.handleLoad = this.handleLoad.bind(this);
  }

  handleLoad(e) {
    const imageList = this.state.request.response.split('\n');

    this.props.clientList.forEach((element) => {
      const index = Math.floor(Math.random() * (imageList.length - 1));
      const url = imageList[index];
      imageList.splice(index, 1);

      console.log(`${element}: ${url}`);

      const bodyString = `ID=${element}&pngUrl=${url}&x=30&y=30`;
      fetch(`http://127.0.0.1:8002/send/image?${bodyString}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      this.props.updateUrlState(element, url);
    });
  }

  onButtonClick() {
    const xmlhttp = new XMLHttpRequest();
    xmlhttp.addEventListener('load', this.handleLoad);
    xmlhttp.open('GET', `http://192.168.0.14:5001/${this.props.name}/manifest.txt`, true);
    xmlhttp.send();

    this.setState({ request: xmlhttp });
  }

  render() {
    return (
      <div className="group">
        <button onClick={this.onButtonClick}>{this.props.name}</button>
      </div>
    );
  }
}
