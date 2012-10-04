//Copyright 2009 Nicholas C. Zakas. All rights reserved.
//MIT Licensed
function timedChunk(positions, particles, process, context, callback){
  //var todo = items.concat();   //create a clone of the original

  setTimeout(function(){

    var start = +new Date();

    do {
      process.call(context, positions.shift(), particles.shift());
    } while (positions.length > 0 && (+new Date() - start < 50));

    if (positions.length > 0){
      setTimeout(arguments.callee, 25);
    } else {
      callback(positions, particles);
    }
  }, 25);
}
