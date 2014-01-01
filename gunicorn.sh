#!/bin/bash
pushd `dirname $0`
source venv/bin/activate
gunicorn --log-level debug --access-logfile access.log --error-logfile gunicorn_error.log app:app -w 4 -b 127.0.0.1:9990
popd
