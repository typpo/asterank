#!/usr/bin/env python
from flask import Flask, request, redirect, session, url_for, render_template, Response, jsonify
from flask.ext.assets import Environment, Bundle
import urllib
import urlparse
import json
import random
import base64
import re

import api

app = Flask(__name__)
app.secret_key = 'not a secret key'

# bundling
assets = Environment(app)

# main routes/api routes
@app.route("/")
def index():
  return render_template('index.html')

@app.route('/api/mpc')
def api_mpc():
  try:
    query = json.loads(request.args.get('query'))
    limit = min(1000, int(request.args.get('limit')))
    json_resp = json.dumps(api.mpc(query, limit))
    return Response(json_resp, mimetype='application/json')
  except:
    resp = jsonify({'error': 'bad request'})
    resp.status_code = 500
    return resp

@app.route('/api/kepler')
def api_kepler():
  try:
    query = json.loads(request.args.get('query'))
    limit = min(1000, int(request.args.get('limit')))
    json_resp = json.dumps(api.kepler(query, limit))
    return Response(json_resp, mimetype='application/json')
  except:
    resp = jsonify({'error': 'bad request'})
    resp.status_code = 500
    return resp

@app.route('/api/exoplanets')
def api_exoplanets():
  try:
    query = json.loads(request.args.get('query'))
    limit = min(1000, int(request.args.get('limit')))
    json_resp = json.dumps(api.exoplanets(query, limit))
    return Response(json_resp, mimetype='application/json')
  except:
    resp = jsonify({'error': 'bad request'})
    resp.status_code = 500
    return resp

@app.route('/api/asterank')
def api_asterank():
  try:
    query = json.loads(request.args.get('query'))
    limit = min(1000, int(request.args.get('limit')))
    json_resp = json.dumps(api.asterank(query, limit))
    return Response(json_resp, mimetype='application/json')
  except:
    resp = jsonify({'error': 'bad request'})
    resp.status_code = 500
    return resp

@app.route('/api/rankings')
def rankings():
  try:
    limit = int(request.args.get('limit')) or 10
    results = api.rankings(request.args.get('sort_by'), limit)
    json_resp = json.dumps(results)
    return Response(json_resp, mimetype='application/json', headers={ \
      'Cache-Control': 'max-age=432000', # 5 days
    })
  except:
    resp = jsonify({'error': 'bad request'})
    resp.status_code = 500
    return resp

@app.route('/api/autocomplete')
def autocomplete():
  results = api.autocomplete(request.args.get('query'), 10)
  json_resp = json.dumps(results)
  return Response(json_resp, mimetype='application/json', headers={ \
    'Cache-Control': 'max-age=432000',  # 5 days
  })

@app.route('/api/compositions')
def compositions():
  json_resp = json.dumps(api.compositions())
  return Response(json_resp, mimetype='application/json')


@app.route('/jpl/lookup')
def horizons():
  query = request.args.get('query')
  result = api.jpl_lookup(query)
  if result:
    json_resp = json.dumps(result)
    return Response(json_resp, mimetype='application/json')
  else:
    return Response('{}', mimetype='application/json')

# Misc Pages
@app.route('/about')
def about():
  return render_template('about.html')

@app.route('/feedback')
@app.route('/contact')
def contact():
  return render_template('contact.html')

@app.route('/mpc')
def mpc():
  return render_template('mpc.html')

@app.route('/kepler')
def kepler():
  return render_template('kepler.html')

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', use_reloader=True)
