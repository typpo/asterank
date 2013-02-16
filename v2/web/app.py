#!/usr/bin/env python
from flask import Flask, request, redirect, session, url_for, render_template
import urllib
import urlparse
import json
import random
import base64
import re

app = Flask(__name__)
app.secret_key = 'not a secret key'

@app.route("/")
def index():
  return render_template('index.html')

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', use_reloader=False)
