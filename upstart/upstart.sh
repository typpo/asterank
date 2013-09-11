#!/bin/bash

pushd `dirname $0`
cd "$(git rev-parse --show-toplevel)"
mkdir -p /var/log/asterank

echo "starting `date`"

# main app
./gunicorn.sh 2>> /var/log/asterank/err.log 1>> /var/log/asterank/out.log &

# other apps go here...

# block
for job in `jobs -p`
do
echo $job
  wait $job
done

popd
