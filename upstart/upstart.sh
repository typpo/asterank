#!/bin/bash

pushd `dirname $0`
cd "$(git rev-parse --show-toplevel)"
mkdir -p /var/log/asterank

echo "starting `date`"

# main
./v2/gunicorn.sh 2>> /var/log/asterank/err.log 1>> /var/log/asterank/out.log &

# node
export NODE_ENV=production
node web/app.js 2>> /var/log/asterank/node.err.log 1>> /var/log/asterank/node.out.log &

for job in `jobs -p`
do
echo $job
  wait $job
done

popd
