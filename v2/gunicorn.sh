#!/bin/bash
source bin/activate
gunicorn app:app -b 127.0.0.1:9990
