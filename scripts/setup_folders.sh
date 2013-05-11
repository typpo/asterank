#!/bin/bash -e

me=`whoami`
sudo mkdir -p /var/asterank/neat_astrometry_store /var/asterank/neat_astrometry_cache /var/asterank/skymorph_store /var/asterank/skymorph_cache

sudo chown -R $me.$me /var/asterank/

echo "Done."
