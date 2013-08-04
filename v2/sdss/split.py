#!/usr/bin/env python
#
# Splits image into its RGB components - for SDSS blinking
#
import sys
import os
from PIL import Image

path = os.path.abspath(sys.argv[1])
newpath_prefix, ext = os.path.splitext(path)

print 'Splitting %s...' % path

im = Image.open(path)
im.load()
r, g, b = im.split()

r.save('%s_r_split%s' % (newpath_prefix, ext))
g.save('%s_g_split%s' % (newpath_prefix, ext))
b.save('%s_b_split%s' % (newpath_prefix, ext))
