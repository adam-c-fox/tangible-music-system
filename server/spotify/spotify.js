const express = require('express');
var cors = require("cors");
const app = express();
const port = 8004;
app.get('/', (req, res) => res.send(as))
app.use(express.json());
app.use(cors());

const host = process.env.HOST;
console.log(`host: ${host}`);

// SPOTIFY CONFIG ----------------------------------------  

const spotify = require('spotify-web-api-node');
const spotifyApi = new spotify({
  clientId: '52e914108f7c4726aa4e02fb8923ae41',
  clientSecret: '65de00e35a4341e3965c9224340a0f68',
  redirectUri: `http://${host}:${port}/spotify/callback`
})
const scopes = ['app-remote-control', 'streaming', 'user-top-read', 'user-read-playback-state'];
const state = "";
const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
let spotifyAuthCode = "";


// SPOTIFY ENDPOINTS ----------------------------------------  

function spotifyPause() {
  spotifyApi.pause()
    .then(function(data) { console.log("[spotify] pause"); })
    .catch(function(err) { console.log("[spotify] Something went wrong...", err) });
};

function spotifyPlay() {
  spotifyApi.play()
    .then(function(data) { console.log("[spotify] play"); })
    .catch(function(err) { console.log("[spotify] Something went wrong...", err) });
};

app.get('/spotify/top-tracks', function(req, res) {
  spotifyApi.getMyTopTracks()
    .then(function(data) { 
      console.log("[spotify] top tracks") 
      res.status(200).json(data.body.items);
    })
    .catch(function(err) { console.log("[spotify] Something went wrong...", err) });
});

app.get('/spotify/artist-top-tracks', function(req, res) {
  const { artistName } = req.query;

  spotifyApi.searchArtists(artistName)
    .then(function(data) {
      const { id } = data.body.artists.items[0];

      spotifyApi.getArtistTopTracks(id, 'gb')
        .then(function(data) {
          res.status(200).json(data);
        })
        .catch(function(err) { console.log("[spotify] Something went wrong...", err) });
    })
    .catch(function(err) { console.log("[spotify] Something went wrong...", err) });
});

app.get('/spotify/get-similar-tracks', function(req, res) {
  const { trackID } = req.query;

  spotifyApi.getRecommendations({ seed_tracks: [trackID] })
    .then(function(data) {
      res.status(200).json(data.body.tracks);
    })
    .catch(function(err) { console.log("[spotify] Something went wrong...", err) });
});

app.get('/spotify/search-for-playlist', function(req, res) {
  const { playlistName } = req.query;

  spotifyApi.searchPlaylists(playlistName)
    .then(function(data) {
      res.status(200).json(data.body.playlists.items);
    })
    .catch(function(err) { console.log("[spotify] Something went wrong...", err) });
});

app.get('/spotify/get-tracks-from-playlist', function(req, res) {
  const { playlistID } = req.query;

  spotifyApi.getPlaylistTracks(playlistID)
    .then(function(data) {
      // Retrieve Track object from Playlist object
      const tracks = data.body.items.map(x => x.track);
      res.status(200).json(tracks);
    })
    .catch(function(err) { console.log("[spotify] Something went wrong...", err) });
});

app.get('/spotify/get-my-playlists', function(req, res) {
  let id = null;

  spotifyApi.getMe()
    .then(function(data) {
      id = data.body.id;
    });

  spotifyApi.getUserPlaylists(id)
    .then(function(data) {
      res.status(200).json(data.body.items);
    });

});

app.post('/spotify/control', function(req, res) {
  const { command } = req.query;

  if(command == 'pause') {
    spotifyPause();
  } else if (command == 'play') {
    spotifyPlay();
  } else {
    res.status(404).send(`Command '${command}' not found`);
  }

  res.status(200).send();
});

app.post('/spotify/play/track', function(req, res) {
  const { trackUri } = req.query;

  const list = [ trackUri ]; 
  const json = { uris: list };

  spotifyApi.play(json)
    .then(function(data) { console.log("[spotify] play track: " + trackUri); })
    .catch(function(err) { console.log("[spotify] Something went wrong...", err) });

  res.status(200).send();
});

app.post('/spotify/play/playlist', function(req, res) {
  const { playlistUri } = req.query;

  const json = { context_uri: playlistUri };

  spotifyApi.play(json)
    .then(function(data) { console.log("[spotify] play playlist: " + playlistUri); })
    .catch(function(err) { console.log("[spotify] Something went wrong...", err) });

  res.status(200).send();
});

app.get('/spotify/callback', function(req, res) {
  // Auth code result  
  spotifyAuthCode = req.query.code;
  res.status(200).redirect(`http://${host}:3000`);

  spotifyApi.authorizationCodeGrant(spotifyAuthCode)
    .then(function(data) {
      console.log("access_token", data.body['access_token']);
      console.log("refresh_token", data.body['refresh_token']);

      spotifyApi.setAccessToken(data.body['access_token']);
      spotifyApi.setRefreshToken(data.body['refresh_token']);
    })
    .catch(function(err) {
      console.log("[spotify] Something went wrong...", err)
    });
});

app.get('/spotify/authorise', function(req, res) {
  res.status(200).redirect(authorizeURL);
});

app.get('/spotify/has-credentials', function(req, res) {
  const creds = spotifyApi.getCredentials();

  res.status(200).json('accessToken' in creds);
});

app.get('/spotify/is-playing', function(req, res) {
  spotifyApi.getMyCurrentPlaybackState()
    .then(function(data) { res.status(200).json(data.body.is_playing ? true : false) })
    .catch(function(err) { res.status(500).json(err) });
});


app.listen(port, () => { console.log(`Spotify REST interface: ${port}`); });
