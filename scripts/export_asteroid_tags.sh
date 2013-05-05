#!/bin/sh
# Exports a list of asteroid names from the database
mongoexport -d asterank -c jpl -f tag_name -o tags
