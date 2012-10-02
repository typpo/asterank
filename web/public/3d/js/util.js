//Copyright 2009 Nicholas C. Zakas. All rights reserved.
//MIT Licensed
function timedChunk(items, process, context, callback){
  var todo = items.concat();   //create a clone of the original

  setTimeout(function(){

    var start = +new Date();

    do {
      process.call(context, todo.shift());
    } while (todo.length > 0 && (+new Date() - start < 50));

    if (todo.length > 0){
      setTimeout(arguments.callee, 25);
    } else {
      callback(items);
    }
  }, 25);
}
