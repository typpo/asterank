self.addEventListener('message', function(e) {
  var data = e.data;
  console.log('wwopwwwoop');
  var jed = data.jed;
  var l = data.particles.length;
  for (var i=0; i < l; i++) {
    data.particles[i].MoveParticle(jed);
  }
}, false);
