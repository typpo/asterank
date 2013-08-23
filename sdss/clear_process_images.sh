#!/bin/bash -e
# Clears split rgb images

find data/ | grep _split | grep jpg$ | xargs -L 1 rm
echo "Done."
