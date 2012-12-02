//Adapted from:
//Copyright 2009 Nicholas C. Zakas. All rights reserved.
//MIT Licensed
function timedChunk(particles, positions, fn, context, callback){
  var i = 0;
  var tick = function() {
    var start = new Date().getTime();
    for (; i < positions.length && (new Date().getTime()) - start < 50; i++) {
      fn.call(context, particles[i], positions[i]);
    }

    if (i < positions.length) {
      setTimeout(tick, 25);
    } else {
      callback(positions, particles);
    }
  };
  setTimeout(tick, 25);
}

function toJED(d){
  // TODO precompute constants
  return Math.floor((d.getTime() / (1000 * 60 * 60 * 24)) - 0.5) + 2440588;
}

function fromJED(jed) {
  return new Date(1000*60*60*24 * (0.5 - 2440588 + jed));
}

function getColorFromPercent(value, highColor, lowColor) {
    var r = highColor >> 16;
    var g = highColor >> 8 & 0xFF;
    var b = highColor & 0xFF;

    r += ((lowColor >> 16) - r) * value;
    g += ((lowColor >> 8 & 0xFF) - g) * value;
    b += ((lowColor & 0xFF) - b) * value;

    return (r << 16 | g << 8 | b);
}
