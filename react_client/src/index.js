import React, { Component } from 'react';
import ReactDOM from 'react-dom';

//const ws = new WebSocket('ws://127.0.0.1:8000');
//console.log('hello');

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
  }

  render() {
    return (
      <div className="stack">
        <form onSubmit={this.onSubmit}>
          <label>
            {this.props.index} : PNG URL  
              <input type="text" name="url" onChange={this.onChange} size="80"/>
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
    var imageList = this.state.request.response.split("\n");

    this.props.clientList.forEach(element => {
      var index = Math.floor(Math.random() * (imageList.length-1));
      var url = imageList[index];
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
    });
  }

  onButtonClick() {
    var result = null;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.addEventListener('load', this.handleLoad);
    xmlhttp.open("GET", "http://192.168.0.14:5001/" + this.props.name + "/manifest.txt", true)
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

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      clientList: [],
    };
  }

  renderStack(i) {
    return < Stack index={i} />
  }

  renderGroup(name, clientList) {
    return < Group name={name} clientList={clientList} />
  }

  getClientList() {
    fetch("http://127.0.0.1:8002/client/list")
      .then(res => res.json())
      .then(res => this.setState({ clientList: res }))
  }

  componentWillMount() {
    this.getClientList();
  }
  
  render() {
    var stacks=[];
    this.state.clientList.forEach(element => stacks.push(this.renderStack(element)));

    var groups = [this.renderGroup("test", this.state.clientList)];

    return (
      <div className="App">
        <h1>client_controller</h1>
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
