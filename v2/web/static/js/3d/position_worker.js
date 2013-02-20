var Ephemeris = getEphemeris();
var pi = Math.PI;
var PIXELS_PER_AU = 50;
var positions = [];

var jed, jed_threshold;
var running = true;
var simulationData = null;

self.addEventListener('message', function(e) {
  var data = e.data;
  switch (data.command) {
    case 'results':
      // send over last full set of positions
      /*
      sendResult({
        positions: positions
      });
      */
      break;
    case 'set_jed':
      setJED(data.jed);
      if (!running) {
        // we have to update manually for one step
        runSimulation(simulationData);
      }
      break;

    case 'toggle_simulation':
      if (data.val) {
        // start if not already started
        if (!running) {
          running = true;
          runSimulation(simulationData);
        }
      }
      else {
        // stop
        running = false;
      }
      break;
    case 'start':
      var start_jed = data.start_jed;
      setJED(start_jed);
      simulationData = data;
      runSimulation(data);
      break;
  }
}, false);

function setJED(new_jed) {
  jed = new_jed;
  jed_threshold = new_jed + 365.25;
}

function runSimulation(data) {
  var l = data.particle_ephemeris.length;
  var particle_ephemeris = data.particle_ephemeris;
  (function step() {
    var partial_positions = [];
    for (var i=0; i < l; i++) {
      var pos = getPosAtTime(particle_ephemeris[i], jed);
      partial_positions.push(pos);
    }
    //positions = partial_positions;
    sendResult({
      positions: partial_positions,
      jed: jed
    });
    jed += .25;
    if (running) {
      setTimeout(step, 60);
    }
  })();
}

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
  var i = (eph.i) * pi/180;
  var o = (eph.om) * pi/180; // longitude of ascending node
  var p = (eph.w_bar || eph.w + eph.om) * pi/180; // longitude of perihelion
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
  var d = jed - epoch;
  //L = ma + p;
  //M =  n * -d + L - p;
  M = ma + n * d;

  var sin = Math.sin, cos = Math.cos;
  // Estimate eccentric and true anom using iterative approx
  var E0 = M;
  var lastdiff;
  do {
    var E1 = M + e * sin(E0);
    lastdiff = Math.abs(E1-E0);
    E0 = E1;
  } while(lastdiff > 0.0000001);
  //} while(lastdiff > 0.00001);
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

function getEphemeris() {
  return {
    mercury: {
      full_name: 'Mercury',
      ma: 174.79439,
      epoch: 2451545.0,
      a: 0.38709893,
      e: 0.20563069,
      i: 7.00487,
      w: 77.45645,
      L: 252.25084,
      om: 48.33167,
      P: 87.969
    },
    venus: {
      full_name: 'Venus',
      ma: 50.37663231999999,
      epoch: 2451545.0,
      a:0.72333566,
      e:0.00677672,
      i:3.39467605,
      w:131.60246718,
      L:181.97909950,
      om:76.67984255,
      P: 224.701
    },
    earth: {
      full_name: 'Earth',
      ma: -2.4731102699999905,
      epoch: 2451545.0,
      a:1.00000261,
      e:0.01671123,
      i:-0.00001531,
      w:102.93768193,
      L:100.46457166,
      //om:-11.26064,
      om: 0,
      P: 365.256
    },
    mars:{
      full_name: 'Mars',
      ma: 19.412479999999945,
      epoch: 2451545.0,
      a: 1.52366231,
      e: 0.09341233,
      i: 1.85061,
      w: 336.04084,
      L:355.45332,
      om:49.57854,
      P: 686.980
    },
    jupiter: {
      full_name: 'Jupiter',
      ma: 19.66796068,
      epoch: 2451545.0,
      a:5.20288700,
      e:0.04838624,
      i:1.30439695,
      w:14.72847983,
      L:34.39644051,
      om:100.47390909,
      P: 4332.589
    }
  };
}
