#/bin/bash

pushd `dirname $0`

wget -O mpcorb.dat.gz http://www.minorplanetcenter.net/iau/MPCORB/MPCORB.DAT.gz
gunzip -f mpcorb.dat.gz

python mpcread.py mpcorb.dat

#rm mpcorb.dat

popd
