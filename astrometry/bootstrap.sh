#/bin/bash -e
# Astrometry setup for ubuntu/debian-like systems

# Dependencies
sudo apt-get install libcairo2-dev libnetpbm10-dev netpbm \
                          libpng12-dev libjpeg-dev python-numpy \
                          python-pyfits cfitsio-dev \
                          libnetpbm10-dev swig
#zlib-devel

wget -O astrometry.net-0.43.tar.gz http://astrometry.net/downloads/astrometry.net-0.43.tar.gz
tar xzvf astrometry.net-0.43.tar.gz
pushd astrometry.net-0.43

# build & install
./configure
make
make extra
sudo make install

echo "Adding /usr/local/astrometry/bin to your path..."
echo "export PATH=$PATH:/usr/local/astrometry/bin" >> ~/.bashrc

# Download all the indexes...
echo "Downloading indexes.  This will take a while..."
../download_indexes.sh
sudo mv index-* /usr/local/astrometry/data

popd
rm astrometry.net-0.43.tar.gz
