#!/bin/bash -e
# Processes all SDSS images into RGB channels

find data/ | grep -v split | grep jpg$ | xargs -L 1 python split.py
echo "Done."
