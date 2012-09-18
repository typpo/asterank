self.addEventListener('message', function(e) {
  var data = e.data;
  var jed = data.jed;
  var l = data.particles.length;
  self.postMessage({
    type: 'debug',
    value: data
  });
  for (var i=0; i < l; i++) {
    data.particles[i].MoveParticle(jed);
  }
}, false);

function getPosAtTime(obj, jed) {

}
