#!/bin/bash -e

# Boilerplate
pushd `dirname $0`
OUT="`git rev-parse --show-toplevel`/data/out"
STATIC="`git rev-parse --show-toplevel`/data/static"
mkdir -p $OUT/kepler

# TODO http://archive.stsci.edu/kepler/planet_candidates.html?print=1

#"http://planetquest.jpl.nasa.gov/kepler/columns?&json={"rows":"ALL","columns":["ROW","KOI","RPLANET","PER","UPER","T0","UT0","A","TPLANET","MSTAR","TSTAR","RSTAR","KMAG","RA","DEC"]}"
URL="http://planetquest.jpl.nasa.gov/kepler/columns?&json=%7B%22rows%22%3A%22ALL%22%2C%22columns%22%3A%5B%22ROW%22%2C%22KOI%22%2C%22RPLANET%22%2C%22PER%22%2C%22UPER%22%2C%22T0%22%2C%22UT0%22%2C%22A%22%2C%22TPLANET%22%2C%22MSTAR%22%2C%22TSTAR%22%2C%22RSTAR%22%2C%22KMAG%22%2C%22RA%22%2C%22DEC%22%5D%7D"

$OUT_PATH=$OUT/kepler/kepler.json
wget -O $OUT_PATH $URL
python keplerread.py $OUT_PATH

popd
