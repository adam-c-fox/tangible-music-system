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

  render() {
    const { index } = this.props;
    return (
      <div className="stack">
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
    );
  }
}

Stack.propTypes = {
  index: PropTypes.number.isRequired,
  updateUrlState: PropTypes.func.isRequired,
};
