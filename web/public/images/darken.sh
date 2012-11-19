#!/bin/bash
for file in s_*.jpg
do
  echo $file
  convert -brightness-contrast -30x0 "$file" "dark-$file"
done
