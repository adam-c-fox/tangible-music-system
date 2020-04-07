import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class Stack extends Component {
  constructor(props) {
    super(props);
    this.state = {
      url: '',
    };

    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.nfcButtonClick = this.nfcButtonClick.bind(this);
  }

  onChange(event) {
    this.setState({ url: event.target.value });
  }

  onSubmit(event) {
    event.preventDefault();

    const { index, updateUrlState } = this.props;
    const { url } = this.state;

    const bodyString = `ID=${index}&pngUrl=${url}&x=40&y=0`;
    fetch(`http://127.0.0.1:8002/send/image?${bodyString}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    updateUrlState(index, url);
  }

  nfcButtonClick() {
    const { index, setNfcClientToUpdate } = this.props;

    setNfcClientToUpdate(index);
  }

  render() {
    const { index, nfcValue } = this.props;
    return (
      <div>
        <div className="stack" style={{ float: 'left' }}>
          <form onSubmit={this.onSubmit}>
            <label htmlFor="name">
              {index}
              {' '}
              : PNG URL
              <input type="text" name="url" onChange={this.onChange} size="80" />
            </label>
            <input type="submit" value="Submit" />
          </form>

        </div>

        <div>
          <button type="button" onClick={this.nfcButtonClick}>Program NFC</button>
          {nfcValue}
        </div> 
      </div>
    );
  }
}

Stack.propTypes = {
  index: PropTypes.number.isRequired,
  updateUrlState: PropTypes.func.isRequired,
  nfcValue: PropTypes.number.isRequired,
  setNfcClientToUpdate: PropTypes.func.isRequired,
};
