#/bin/bash
# Astrometry setup for ubuntu/debian-like systems

# Dependencies
sudo apt-get install libcairo2-dev libnetpbm10-dev netpbm \
                          libpng12-dev libjpeg-dev python-numpy \
                          zlib-devel python-pyfits cfitsio-dev \
                          libnetpbm10-dev

wget http://astrometry.net/downloads/astrometry.net-0.43.tar.gz
tar xzvf astrometry.net-0.43.tar.gz
pushd astrometry.net-0.43

# build & install
./configure
make
make extra
sudo make install

echo "Adding /usr/local/astrometry/bin to your path..."
echo "export PATH=$PATH:/usr/loca/astrometry/bin" >> ~/.bashrc

# Download all the indexes...
echo "Downloading indexes.  This will take a while..."
./download_indexes.sh
make install-indexes

popd
