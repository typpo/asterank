#!/bin/bash
# Deploys to production

pushd `dirname $0`
cd ..

rsync -avz --exclude='.git/' -e "ssh -o stricthostkeychecking=no -o userknownhostsfile=/dev/null" --progress . asterank.com:~/asterank

popd
