import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { w3cwebsocket as W3CWebSocket } from "websocket";

//const ws = new WebSocket('ws://192.168.0.14:8001');
//console.log('hello');
const client = new W3CWebSocket('ws://192.168.0.14:8001');

class Stack extends Component {
  constructor(props) {
    super(props);
    this.state = {
      url: "",
    }

    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onChange(event) {
    this.setState({ url: event.target.value })
  }

  onSubmit(event) {
    event.preventDefault();

    const bodyString = "ID=" + this.props.index + "&pngUrl=" + this.state.url + "&x=30&y=30";
    fetch("http://127.0.0.1:8002/send/image?" + bodyString, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });

    this.props.updateUrlState(this.props.index, this.state.url);
  }

  render() {
    return (
      <div className="stack">
        <form onSubmit={this.onSubmit}>
          <label>
            {this.props.index} : PNG URL
              <input type="text" name="url" onChange={this.onChange} size="80" />
          </label>
          <input type="submit" value="Submit" />
        </form>
      </div>
    );
  }
}

class Group extends Component {
  constructor(props) {
    super(props);
    this.state = {
      request: null,
    }

    this.onButtonClick = this.onButtonClick.bind(this);
    this.handleLoad = this.handleLoad.bind(this);
  }

  handleLoad(e) {
    const imageList = this.state.request.response.split("\n");

    this.props.clientList.forEach(element => {
      const index = Math.floor(Math.random() * (imageList.length - 1));
      const url = imageList[index];
      imageList.splice(index, 1);

      console.log(element + ": " + url);

      const bodyString = "ID=" + element + "&pngUrl=" + url + "&x=30&y=30";
      fetch("http://127.0.0.1:8002/send/image?" + bodyString, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });

      this.props.updateUrlState(element, url);
    });
  }

  onButtonClick() {
    const xmlhttp = new XMLHttpRequest();
    xmlhttp.addEventListener('load', this.handleLoad);
    xmlhttp.open("GET", "http://192.168.0.14:5001/" + this.props.name + "/manifest.txt", true);
    xmlhttp.send();

    this.setState({ request: xmlhttp });
  }

  render() {
    return (
      <div className="group">
        <button onClick={this.onButtonClick}>{this.props.name}</button>
      </div>
    )
  }
}

const Active = ({ activeImageUrl }) => (
  <div className="active" style={{ ...!activeImageUrl && { opacity: 0 } }}>
    <img src={activeImageUrl} height="240" width="240"></img>
  </div>
);


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      clientList: [],
      urlState: Array(8).fill(null),
      activeImageUrl: "",
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
    return <Active activeImageUrl={this.state.activeImageUrl}> </Active>
  }

  getClientList() {
    fetch("http://127.0.0.1:8002/client/list")
      .then(res => res.json())
      .then(res => this.setState({ clientList: res }))
  }

  componentWillMount() {
    this.getClientList();

    client.onopen = () => {
      console.log("WS connected.")
    }

    client.onmessage = (message) => {
      console.log(message);

      const jsonMessage = JSON.parse(message.data);
      console.log(jsonMessage);

      if (jsonMessage["focus"]) {
        const url = this.state.urlState[jsonMessage["id"]];
        this.setState({ activeImageUrl: url });
      } else {
        this.setState({ activeImageUrl: null });
      }

    }
  }

  render() {
    const stacks = [];
    this.state.clientList.forEach(element => stacks.push(this.renderStack(element)));

    const groups = [this.renderGroup("test", this.state.clientList)];
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
  document.getElementById('root')
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
