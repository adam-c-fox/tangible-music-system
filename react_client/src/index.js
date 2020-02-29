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
              <input type="text" name="url" onChange={this.onChange} />
          </label>
          <input type="submit" value="Submit" />
        </form>
      </div>
    );
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      apiResponse: [],
    };
  }

  renderStack(i) {
    return <Stack 
      index={i} 
    />
  }

  getClientList() {
    fetch("http://127.0.0.1:8002/client/list")
      .then(res => res.json())
      .then(res => this.setState({ apiResponse: res }))
  }

  componentWillMount() {
    this.getClientList();
  }
  
  render() {
    var elements=[];
    this.state.apiResponse.forEach(element => elements.push(this.renderStack(element)));

    return (
      <div className="App">
        <h1>client_controller</h1>
        <p>{elements}</p>
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
