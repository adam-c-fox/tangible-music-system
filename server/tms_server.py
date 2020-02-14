import sys
import spotipy
import spotipy.util as util
import flask
from flask import request, jsonify
import wget
from PIL import Image
import os
import re
from random import seed
from random import randint 
seed(1)

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
    image_url = sp.currently_playing()['item']['album']['images'][0]['url']
    filename = wget.download(image_url, os.getcwd() + "/download")

    im = Image.open(filename)
    new_im = im.resize((160, 160))
    new_filename = os.getcwd() + "/png/" + str(randint(1, 99999)) + ".png"
    new_im.save(new_filename)

    #TODO: change to only download art we don't have
    os.remove(filename)

    png_image_url = "http://192.168.0.38:5001/" + re.search("png/.*", new_filename).group()
    return png_image_url





########## UTILS ##########

def return_spotipy(scope):
    token = util.prompt_for_user_token(username, scope)
    return spotipy.Spotify(auth=token)

app.run(host= '0.0.0.0')
