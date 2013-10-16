#!/usr/bin/env python
#
# Splits image into its RGB components - for SDSS blinking
#
import sys
import os
import operator
import math
from PIL import Image, ImageEnhance

FRAME_SIZE = 512
OVERLAP_RATIO = .11

path = os.path.abspath(sys.argv[1])
newpath_prefix, ext = os.path.splitext(path)

print 'Splitting %s...' % path
if path.find('-thumb-') > -1:
  print 'Skipping thumb'
  sys.exit(1)

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

# crop it
xmin = ymin = 0
xmax = ymax = FRAME_SIZE
num_frames = 0

overlap_px_delta = int(math.ceil((1.-OVERLAP_RATIO) * FRAME_SIZE))
while xmax < im.size[0]:  # width
  while ymax < im.size[1]:  # height
    num_frames += 1
    box = (xmin, ymin, min(im.size[0], xmax), min(im.size[1], ymax))
    im_frame = im.crop(box)

    r, g, b = im_frame.split()

    b = b.point(lambda p: p * 1.5)   # blues tend to be too dim
#r = r.point(lambda p: p * 0.8)   # reds tend to overpower in sdss imagery
#r = equalize(r)
#g = equalize(g)
#b = equalize(b)

    r.save('%s_r_split%d%s' % (newpath_prefix, num_frames, ext))
    g.save('%s_g_split%d%s' % (newpath_prefix, num_frames, ext))
    b.save('%s_b_split%d%s' % (newpath_prefix, num_frames, ext))

    ymax += overlap_px_delta
    ymin += overlap_px_delta
  xmax += overlap_px_delta
  xmin += overlap_px_delta
  ymin = 0
  ymax = FRAME_SIZE
