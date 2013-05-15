#!/bin/bash -e

# Boilerplate
cd `dirname $0`
OUT="`git rev-parse --show-toplevel`/data/pipeline/out"
mkdir -p $OUT/deltav

# Run dv calculations
DV_OUT="$OUT/deltav/deltav.csv"
SBDB_OUT="$OUT/sbdb/sbdb.csv"
python benner_dv.py > $DV_OUT
