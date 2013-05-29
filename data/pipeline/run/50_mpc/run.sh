#/bin/bash -e

# Boilerplate
pushd `dirname $0`
OUT="`git rev-parse --show-toplevel`/data/pipeline/out"
STATIC="`git rev-parse --show-toplevel`/data/pipeline/static"
mkdir -p $OUT/mpc

GZ_PATH=$OUT/mpc/mpcorb.dat.gz
OUT_PATH=$OUT/mpc/mpcorb.dat

wget -O $GZ_PATH http://www.minorplanetcenter.net/iau/MPCORB/MPCORB.DAT.gz
gunzip -c $GZ_PATH > $OUT_PATH

python mpcread.py $OUT_PATH

popd
