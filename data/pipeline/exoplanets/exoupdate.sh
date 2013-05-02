#!/bin/bash

pushd `dirname $0`

# Exoplanet Archive
# http://exoplanetarchive.ipac.caltech.edu/docs/program_interfaces.html#data
#URL="http://exoplanetarchive.ipac.caltech.edu/cgi-bin/nstedAPI/nph-nstedAPI?table=exoplanets"
URL="http://exoplanetarchive.ipac.caltech.edu/cgi-bin/nstedAPI/nph-nstedAPI?table=cumulative"

wget -O exo.csv $URL

python exoread.py exo.csv

popd
