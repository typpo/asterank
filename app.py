#!/usr/bin/env python
from flask import Flask, request, redirect, session, url_for, render_template, Response, jsonify, make_response
from flask.ext.assets import Environment, Bundle
from flask.ext.mail import Mail
import urllib
import urlparse
import json
import random
import base64
import re

import api
from stackblink import stackblink
from skymorph import skymorph
from sdss import sdss

app = Flask(__name__)
mail = Mail(app)
app.secret_key = 'not a secret key'

# bundling
assets = Environment(app)
# This filter can be helping for debugging javascript.
def noop_filter(_in, out, **kw):
  out.write(_in.read())

# main routes
@app.route("/")
def index():
  return render_template('index.html')

@app.route("/3d")
def view_3d():
  return render_template('full3d.html', noop=noop_filter)

@app.route("/3d/")
def view_3d_slash():
  return render_template('full3d.html', noop=noop_filter)

@app.route("/offline_3d")
def view_3d_offline():
  pt_vars = {};
  pt_vars['offline_mode'] = True
  pt_vars['score_rankings'] = json.dumps(api.rankings('score', 4000, True), allow_nan=False)
  pt_vars['value_rankings'] = json.dumps(api.rankings('value', 4000, True), allow_nan=False)
  pt_vars['accessibility_rankings'] = json.dumps(api.rankings('accessibility', 4000, True), allow_nan=False)
  pt_vars['smallest_rankings'] = json.dumps(api.rankings('smallest', 4000, True), allow_nan=False)

  return render_template('full3d.html', noop=noop_filter, passthrough_vars=pt_vars,  \
      offline_mode=True)

@app.route("/3d/notsupported.html")
def notsupported_3d():
  return render_template('notsupported.html')

@app.route("/asteroid-<asteroid_slug>")
def asteroid_details(asteroid_slug=None):
  # slug is a slug of asteroid prov des
  if not asteroid_slug:
    return 'Sorry, could not find this asteroid in our database.', 404
  unslug = asteroid_slug.replace('-', ' ')
  candidates = api.autocomplete(unslug, 1)  # TODO better way
  if len(candidates) < 1:
    return 'Sorry, could not find this asteroid in our database.', 404

  asteroid = candidates[0]
  jpl_result = api.jpl_lookup(asteroid['prov_des'])
  if 'spec' in asteroid:
    composition_result = api.compositions()[asteroid['spec']]
  else:
    composition_result = []

  return render_template('asteroid.html', asteroid=asteroid, jpl=jpl_result, composition=composition_result)

# General api routes

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
  except ValueError:
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
    orbital_info_only = request.args.get('orbits_only')
    results = api.rankings(request.args.get('sort_by'), limit, orbital_info_only)
    json_resp = json.dumps(results, allow_nan=False)
    return Response(json_resp, mimetype='application/json', headers={ \
      'Cache-Control': 'max-age=432000', # 5 days
    })
  except Exception,e:
    print str(e)
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

# Skymorph routes

@app.route('/api/skymorph/search')
def skymorph_search_target():
  return jsonify({'results': skymorph.search_target(request.args.get('target'))})

@app.route('/api/skymorph/images_for')
def skymorph_images_for():
  return jsonify({'images': skymorph.images_for(request.args.get('target'))})

@app.route('/api/skymorph/search_orbit')
def skymorph_search_orbit():
  search_results = skymorph.search_ephem( \
      request.args.get('epoch'),
      request.args.get('ecc'),
      request.args.get('per'),
      request.args.get('per_date'),
      request.args.get('om'),
      request.args.get('w'),
      request.args.get('i'),
      request.args.get('H'),
      )
  ret = {'results': search_results}
  return jsonify(ret)

@app.route('/api/skymorph/search_position')
def skymorph_search_time():
  search_results = skymorph.search_position( \
      request.args.get('ra'),
      request.args.get('dec'),
      request.args.get('time'),
      )
  ret = {'results': search_results}
  return jsonify(ret)

@app.route('/api/skymorph/image')
def skymorph_image():
  ret = skymorph.get_image(request.args.get('key'))
  if type(ret) == dict:
    return jsonify(ret)
  else:
    response = make_response(ret)
    response.headers["Content-type"] = "image/gif"
    return response

@app.route('/api/skymorph/fast_image')
def skymorph_fast_image():
  ret = skymorph.get_fast_image(request.args.get('key'))
  if type(ret) == dict:
    return jsonify(ret)
  else:
    response = make_response(ret)
    response.headers["Content-type"] = "image/png"
    return response

# SDSS routes
@app.route('/api/sdss/get_unknown_group')
def sdss_unknown_group():
  json_resp = json.dumps(sdss.get_unknown_group())
  return Response(json_resp, mimetype='application/json', headers={ \
    'Cache-Control': 'no-cache',
  })

@app.route('/api/sdss/image')
def sdss_image():
  ret = sdss.image_from_key(request.args.get('key'))
  response = make_response(ret)
  response.headers["Content-type"] = "image/png"
  return response

# Stack/blink Discover routes
@app.route('/discover')
def discover():
  first_time = session.get('discover_first_time', True)
  session['discover_first_time'] = False
  return render_template('discover.html',
      first_time=first_time,
      count=stackblink.get_count())

@app.route('/api/stackblink/get_neat_control_group')
def get_neat_control_group():
  json_resp = json.dumps(stackblink.get_control_groups())
  return Response(json_resp, mimetype='application/json', headers={ \
    'Cache-Control': 'no-cache',
  })

@app.route('/api/stackblink/get_sdss_unknown_group')
def get_sdss_unknown_group():
  json_resp = json.dumps(sdss.get_unknown_group())
  return Response(json_resp, mimetype='application/json', headers={ \
    'Cache-Control': 'no-cache',
  })

@app.route('/api/stackblink/record', methods=['GET', 'POST'])
def stackblink_record():
  postdata = json.loads(request.data)
  json_resp = json.dumps(stackblink.record( \
      postdata.get('email', None), \
      postdata.get('keys', None), \
      postdata.get('interesting', None), \
      postdata.get('poor_quality', None)))

  return Response(json_resp, mimetype='application/json', headers={ \
    'Cache-Control': 'no-cache',
  })

# Kepler

@app.route('/exoplanets')
@app.route('/kepler3d')
def kepler3d():
  return render_template('kepler3d.html')

# User custom objects

@app.route('/api/user_objects', methods=['GET', 'POST'])
def user_objects():
  if request.method == 'GET':
    return jsonify({'results': api.retrieve_user_objects(300)})   # limit set to 300 objects for now

  postdata = json.loads(request.data)
  if 'object' not in postdata:
    return jsonify({})

  obj = postdata['object']
  image_keys = postdata.get('keys', None)
  return jsonify(api.insert_user_object(obj, image_keys))

# Other Pages
@app.route('/about', methods=['GET', 'POST'])
def about():
  if request.method == 'GET':
    return render_template('about.html')
  else:
    email = request.form.get('email', None)
    feedback = request.form.get('feedback', None)
    if feedback:
      from flask.ext.mail import Message
      msg = Message("Asterank Feedback",
                sender="feedback@asterank.com",
                recipients=["typppo@gmail.com"],
                body='%s:\r\n%s' % (email, feedback))
      mail.send(msg)
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

@app.route('/exoplanets')
def exoplanets():
  return render_template('exoplanets.html')

@app.route('/neat')
def neat_docs():
  return redirect('/skymorph')

@app.route('/skymorph')
def skymorph_docs():
  return render_template('skymorph.html')

@app.route('/api')
def api_route():
  return render_template('api.html')

if __name__ == "__main__":
  app.run(debug=True, host='0.0.0.0', use_reloader=True)
