#!/bin/sh
mongoexport -d asterank -c jpl -f tag_name -o tags
