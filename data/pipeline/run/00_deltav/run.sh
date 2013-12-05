#!/bin/bash -e

# Boilerplate
cd `dirname $0`
OUT="`git rev-parse --show-toplevel`/data/pipeline/out"
STATIC="`git rev-parse --show-toplevel`/data/pipeline/static"
mkdir -p $OUT/deltav

# Run dv calculations
BENNER_OUT="$OUT/deltav/benner_deltav.csv"
DV_OUT="$OUT/deltav/computed_dv.csv"
echo "Pulling benner dv ..."
python benner_dv.py > $BENNER_OUT
echo "Computing all dv ..."
python deltav.py "$STATIC/fulldb.20131204.csv" "$BENNER_OUT" "$DV_OUT"
