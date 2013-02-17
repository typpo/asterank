#!/usr/bin/env python
from flask import Flask, request, redirect, session, url_for, render_template, Response
import urllib
import urlparse
import json
import random
import base64
import re

import api

app = Flask(__name__)
app.secret_key = 'not a secret key'

@app.route("/")
def index():
  return render_template('index.html')

@app.route('/api/rankings')
def rankings():
  limit = int(request.args.get('limit')) or 10
  results = api.rankings(request.args.get('sort_by'), limit)
  json_resp = json.dumps(list(results))
  return Response(json_resp, mimetype='application/json')

@app.route('/jpl/lookup')
def horizons():
  query = request.args.get('query')
  results = list(api.jpl_lookup(query))
  if len(results) > 0:
    json_resp = json.dumps(results[0])
    return Response(json_resp, mimetype='application/json')
  else:
    return Response('{}', mimetype='application/json')

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', use_reloader=True)
