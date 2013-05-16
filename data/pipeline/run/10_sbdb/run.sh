#!/bin/bash -e

# Boilerplate
cd `dirname $0`
OUT="`git rev-parse --show-toplevel`/data/pipeline/out"
STATIC="`git rev-parse --show-toplevel`/data/pipeline/static"
mkdir -p $OUT/sbdb

# Run sbdb calculations
# TODO find latest fulldb path automatically..
python horizon.py populatePartialDb \
  --data_path="$STATIC/fulldb.20130406.csv" \
  --mass_path="$STATIC/masses.txt" \
  --dv_path="$OUT/deltav/computed_dv.csv"
