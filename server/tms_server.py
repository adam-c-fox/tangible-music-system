import sys
import spotipy
import spotipy.util as util
import flask
from flask import request, jsonify

# FLASK CONFIG
app = flask.Flask(__name__)
app.config["DEBUG"] = True

# SPOTIPY CONFIG
username = "adamfox26"

@app.route('/playback-state', methods=['GET'])
def playback_state():
    sp = return_spotipy("user-read-playback-state")
    return jsonify(sp.currently_playing())

@app.route('/playback-state/image-url', methods=['GET'])
def playback_state_image_url():
    sp = return_spotipy("user-read-playback-state")
    return sp.currently_playing()['item']['album']['images'][0]['url']





########## UTILS ##########

def return_spotipy(scope):
    token = util.prompt_for_user_token(username, scope)
    return spotipy.Spotify(auth=token)

app.run(host= '0.0.0.0')
