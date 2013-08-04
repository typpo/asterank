#!/usr/bin/env python
#
# Splits image into its RGB components - for SDSS blinking
#
import sys
import os
import operator
from PIL import Image, ImageEnhance

path = os.path.abspath(sys.argv[1])
newpath_prefix, ext = os.path.splitext(path)

print 'Splitting %s...' % path

#def enhance(img):
#  enhancer = ImageEnhance.Contrast(img)
#  return enhancer.enhance(20)

# histogram equalization
def equalize(im):
    h = im.convert("L").histogram()
    lut = []
    for b in range(0, len(h), 256):
        # step size
        step = reduce(operator.add, h[b:b+256]) / 255
        # create equalization lookup table
        n = 0
        for i in range(256):
            lut.append(n / step)
            n = n + h[i+b]
    # map image through lookup table
    return im.point(lut*1)

im = Image.open(path)
if im.size[0] < 500 or im.size[1] < 500:
  print 'Too small.'
  sys.exit(1)
im.load()
r, g, b = im.split()

b = b.point(lambda p: p * 1.5)   # blues tend to be too dim
#r = r.point(lambda p: p * 0.8)   # reds tend to overpower in sdss imagery
#r = equalize(r)
#g = equalize(g)
#b = equalize(b)

r.save('%s_r_split%s' % (newpath_prefix, ext))
g.save('%s_g_split%s' % (newpath_prefix, ext))
b.save('%s_b_split%s' % (newpath_prefix, ext))
