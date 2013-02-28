#!/bin/bash

sudo grep -lr "$1" /var/www/cache | xargs grep KEY:

read -p "Deleting these. OK?" -n 1 -r
if [[ $REPLY =~ ^[Yy]$ ]]
then
  sudo grep -lr "$1" /var/www/cache | sudo xargs rm
fi


