#!/bin/bash

find data/ | grep -v split | grep jpg$ | xargs -L 1 python split.py
