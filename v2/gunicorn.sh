#!/bin/bash
pushd `dirname $0`
source bin/activate
cd web
gunicorn app:app -b 127.0.0.1:9990
popd
