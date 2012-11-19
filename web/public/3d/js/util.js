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
  // TODO precompute the constants
  return Math.floor((d.getTime() / (1000 * 60 * 60 * 24)) - 0.5) + 2440588;
}

function fromJED(jed) {
  return new Date(1000*60*60*24 * (0.5 - 2440588 + jed));
}
