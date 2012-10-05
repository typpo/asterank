//Adapted from:
//Copyright 2009 Nicholas C. Zakas. All rights reserved.
//MIT Licensed
function timedChunk(particles, positions, fn, context, callback){
  setTimeout(function(){
    var start = +new Date();
    do {
      fn.call(context, particles.shift(), positions.shift());
    } while (positions.length > 0 && (+new Date() - start < 50));

    if (positions.length > 0){
      setTimeout(arguments.callee, 25);
    } else {
      callback(positions, particles);
    }
  }, 25);
}
