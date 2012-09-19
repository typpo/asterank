var Ephemeris;
var pi = Math.PI;
var PIXELS_PER_AU = 50;

self.addEventListener('message', function(e) {
  var data = e.data;
  var jed = data.jed;
  Ephemeris = data.ephemeris;
  var l = data.particle_ephemeris.length;
  for (var i=0; i < l; i++) {
    //data.particles[i].MoveParticle(jed);
    var pos = getPosAtTime(data.particle_ephemeris[i], jed);
    sendResult({
      particle_index: i,
      position: pos
    });
  }
}, false);

function log(s) {
  self.postMessage({
    type: 'debug',
    value: s
  });
}

function sendResult(val) {
  self.postMessage({
    type: 'result',
    value: val
  });
}

function getPosAtTime(eph, jed) {
  var e = eph.e;
  var a = eph.a;
  var i = (eph.i-Ephemeris.earth.i) * pi/180;
  var o = (eph.om-Ephemeris.earth.om) * pi/180; // longitude of ascending node
  var p = eph.w * pi/180; // longitude of perihelion
  var ma = eph.ma;
  var M;
  // Calculate mean anomaly at J2000
  ma = ma * pi/180;
  var n;
  if (eph.n)
    n = eph.n * pi/180; // mean motion
  else {
    n = 2*pi / eph.P;
  }
  var epoch = eph.epoch;
  var d = epoch - jed;
  //L = ma + p;
  //M =  n * -d + L - p;
  M = ma + n * -d;

  var sin = Math.sin, cos = Math.cos;
  // Estimate eccentric and true anom using iterative approx
  var E0 = M;
  var lastdiff;
  do {
    var E1 = M + e * sin(E0);
    lastdiff = Math.abs(E1-E0);
    E0 = E1;
  } while(lastdiff > 0.0000001);
  var E = E0;
  var v = 2 * Math.atan(Math.sqrt((1+e)/(1-e)) * Math.tan(E/2));

  // radius vector, in AU
  var r = a * (1 - e*e) / (1 + e * cos(v)) * PIXELS_PER_AU;

  // heliocentric coords
  var X = r * (cos(o) * cos(v + p - o) - sin(o) * sin(v + p - o) * cos(i))
  var Y = r * (sin(o) * cos(v + p - o) + cos(o) * sin(v + p - o) * cos(i))
  var Z = r * (sin(v + p - o) * sin(i))
  var ret = [X, Y, Z];
  return ret;
}
