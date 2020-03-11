import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { w3cwebsocket as W3CWebSocket } from 'websocket';
import Active from './Active';
import Group from './Group';
import Stack from './Stack';

// const ws = new WebSocket('ws://192.168.0.14:8001');
// console.log('hello');
export const client = new W3CWebSocket('ws://192.168.0.14:8001');


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      clientList: [],
      urlState: Array(8).fill(null),
      activeImageUrl: '',
    };

    this.updateUrlState = this.updateUrlState.bind(this);
  }

  updateUrlState(i, url) {
    const updateUrlState = this.state.urlState;
    updateUrlState[i] = url;
    this.setState({ urlState: updateUrlState });
  }

  renderStack(i) {
    return <Stack index={i} updateUrlState={this.updateUrlState} />;
  }

  renderGroup(name, clientList) {
    return <Group name={name} clientList={clientList} updateUrlState={this.updateUrlState} />;
  }

  renderActive() {
    return <Active activeImageUrl={this.state.activeImageUrl}> </Active>;
  }

  getClientList() {
    fetch('http://127.0.0.1:8002/client/list')
      .then((res) => res.json())
      .then((res) => this.setState({ clientList: res }));
  }

  componentWillMount() {
    this.getClientList();

    client.onopen = () => {
      console.log('WS connected.');
    };

    client.onmessage = (message) => {
      console.log(message);

      const jsonMessage = JSON.parse(message.data);
      console.log(jsonMessage);

      if (jsonMessage.focus) {
        const url = this.state.urlState[jsonMessage.id];
        this.setState({ activeImageUrl: url });
      } else {
        this.setState({ activeImageUrl: null });
      }
    };
  }

  render() {
    const stacks = [];
    this.state.clientList.forEach((element) => stacks.push(this.renderStack(element)));

    const groups = [this.renderGroup('test', this.state.clientList)];
    const active = this.renderActive();

    return (
      <div className="App">
        <h1>client_controller</h1>
        <p>{active}</p>
        <p>{stacks}</p>

        <h2>group_send</h2>
        <p>{groups}</p>
      </div>
    );
  }
}

export default App;

ReactDOM.render(
  <App />,
  document.getElementById('root'),
);


// componentDidMount() {
//   ws.onopen = () => {
//     console.log("connected");
//   }

//   //client.onmessage = (message) => {
//   //  const dataFromServer = JSON.parse(message.data);
//   //  const stateToChange = {};

//   //  if (dataFromServer.type === "userevent") {
//   //    stateToChange.currentUsers = Object.values(dataFromServer.data.users);
//   //  } else if (dataFromServer.type === "contentchange") {
//   //    stateToChange.text = dataFromServer.data.editorContent || contentDefaultMessage;
//   //  }

//   //  stateToChange.userActivity = dataFromServer.data.userActivity;
//   //  this.set
//   //}
// }
