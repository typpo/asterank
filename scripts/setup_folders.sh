#!/bin/bash -e

me=`whoami`
sudo mkdir -p /var/asterank/neat_astrometry_store /var/asterank/neat_astrometry_cache /var/asterank/skymorph_store /var/asterank/skymorph_cache

# fallback to just $me for macs
sudo chown -R $me.$me /var/asterank || sudo chown -R $me /var/asterank

echo "Done."
