#!/bin/bash -e
# Loads jpgs from SDSS
# usage: cat stripe_82 | ./load_data

while read rerun run
do
  echo "Loading rerun $rerun, run $run..."
  rsync -aLvz --prune-empty-dirs --progress \
    --include "$run/" --include "?/" --include "frame*.jpg" \
    --exclude "*" \
    rsync://data.sdss3.org/dr10/env/BOSS_PHOTOOBJ/frames/$rerun/ ./data/$rerun/
done

echo "All processing finished"
echo "Done."
