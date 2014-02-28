#!/bin/bash -e

# Boilerplate
cd `dirname $0`
OUT="`git rev-parse --show-toplevel`/data/pipeline/out"
STATIC="`git rev-parse --show-toplevel`/data/pipeline/static"
mkdir -p $OUT/sitemap

python generate_sitemap.py > $OUT/sitemap/sitemap.xml
