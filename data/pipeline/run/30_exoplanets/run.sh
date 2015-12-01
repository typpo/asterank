#!/bin/bash -e

# Boilerplate
pushd `dirname $0`
OUT="`git rev-parse --show-toplevel`/data/pipeline/out"
STATIC="`git rev-parse --show-toplevel`/data/pipeline/static"
mkdir -p $OUT/exo

# Exoplanet Archive
# http://exoplanetarchive.ipac.caltech.edu/docs/program_interfaces.html#data
#URL="http://exoplanetarchive.ipac.caltech.edu/cgi-bin/nstedAPI/nph-nstedAPI?table=exoplanets"
#URL="http://exoplanetarchive.ipac.caltech.edu/cgi-bin/nstedAPI/nph-nstedAPI?table=cumulative"
URL="http://exoplanetarchive.ipac.caltech.edu/cgi-bin/nstedAPI/nph-nstedAPI?table=cumulative&select=koi_sma,kepoi_name,koi_eccen,koi_incl,koi_longp,koi_period,koi_prad,koi_teq,koi_srad,koi_steff,koi_sage,koi_disposition,koi_pdisposition"

OUT_PATH=$OUT/exo/exo.csv
wget -O $OUT_PATH $URL
python exoread.py $OUT_PATH

popd
