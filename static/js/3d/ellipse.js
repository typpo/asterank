;(function() {
  'use strict';

  var pi = Math.PI, sin = Math.sin, cos = Math.cos;
  var PIXELS_PER_AU = 50;

  var Orbit3D = function(eph, opts) {
    opts = opts || {};
    opts.width = opts.width || 1;
    opts.object_size = opts.object_size || 1;
    opts.jed =  opts.jed || 2451545.0;

    this.opts = opts;
    this.name = opts.name;
    this.eph = eph;
    this.particle_geometry = opts.particle_geometry;

    this.CreateParticle(opts.jed, opts.texture_path);
  }

  Orbit3D.prototype.getR = function(t) {
    // Returns distance in AU to point on ellipse with angular parameter t.
    var a = this.eph.a;
    var e = this.eph.e;
    var r = a*(1 - e*e)/(1 + e*cos(t));
    return r;
  }

  Orbit3D.prototype.getPosByAngle = function(t, i, o, w) {
    // Returns a point on the orbit using angular parameter t and 3 orbital
    // angular parameters i, o, w.

    // Distance to the point from the orbit focus.
    var r = this.getR(t) * PIXELS_PER_AU;

    // Heliocentric coords.
    var x = r * (cos(o) * cos(t + w) - sin(o) * sin(t + w) * cos(i));
    var y = r * (sin(o) * cos(t + w) + cos(o) * sin(t + w) * cos(i));
    var z = r * (sin(t + w) * sin(i));

    var point = [x, y, z];
    return point;
  }

  Orbit3D.prototype.getSmoothOrbit = function(pnum) {
    // Returns an pnum-sized array of more or less uniformly separated points
    // along the orbit path.
    var points = [];
    var delta = pi/pnum;
    var alpha = 0;
    var inc = this.eph.i*pi/180.0;
    var w = this.eph.w*pi/180.0;
    var om = this.eph.om*pi/180.0;
    var beta = (this.eph.om + this.eph.w)*pi/180.0;
    var base = 0.0;
    for (var i=0; i <= pnum; i++, alpha+=delta) {
        // Get non-uniformly separated angular parameters.
        var angle = Math.abs(base - pi * sin(alpha)) + base;
        if (i == Math.ceil(pnum/2.0)) {
            base = pi;
        }
        var point = this.getPosByAngle(angle, inc, om, w);
        var vector = new THREE.Vector3(point[0], point[1], point[2]);
        points.push(vector);
    }
    return points;
  }

  Orbit3D.prototype.CreateOrbit = function(jed) {
    var points;
    var parts = 200;

    points = new THREE.Geometry();
    points.vertices = this.getSmoothOrbit(parts);
    points.computeLineDistances();  // Required for dotted lines.

    var line = new THREE.Line(points,
      new THREE.LineDashedMaterial({
        color: this.opts.color,
        linewidth: this.opts.width,
        dashSize: 1,
        gapSize: 0.5
      }), THREE.LineStrip);
    return line;
  }

  Orbit3D.prototype.CreateParticle = function(jed, texture_path) {
    // Dummy position for particle geometry.
    if (!this.particle_geometry) return;
    var tmp_vec = new THREE.Vector3(0,0,0);
    this.particle_geometry.vertices.push(tmp_vec);
  }

  Orbit3D.prototype.MoveParticle = function(time_jed) {
    var pos = this.getPosAtTime(time_jed);
    this.MoveParticleToPosition(pos);
  }

  Orbit3D.prototype.MoveParticleToPosition = function(pos) {
    this.particle.position.set(pos[0], pos[1], pos[2]);
  }

  Orbit3D.prototype.getPosAtTime = function(jed) {
    // Note: this must match the vertex shader.
    // This position calculation is used to follow asteroids in 'lock-on' mode.
    var e = this.eph.e;
    var a = this.eph.a;
    var i = this.eph.i * pi/180;
    var o = this.eph.om * pi/180;  // Longitude of ascending node
    // TODO(ian): This logic prevents values of 0 from being treated properly.
    var p = (this.eph.w_bar || (this.eph.w + this.eph.om)) * pi/180; // LONGITUDE of perihelion
    var ma = this.eph.ma * pi/180;

    // Calculate mean anomaly at jed.
    var n;
    if (this.eph.n) {
      n = this.eph.n * pi/180; // mean motion
    } else {
      n = 2*pi / this.eph.P;
    }
    var epoch = this.eph.epoch;
    var d = jed - epoch;
    var M = ma + n * d;

    // Estimate eccentric and true anom using iterative approx.
    var E0 = M;
    var lastdiff;
    do {
      var E1 = M + e * sin(E0);
      lastdiff = Math.abs(E1-E0);
      E0 = E1;
    } while(lastdiff > 0.0000001);
    var E = E0;
    var v = 2 * Math.atan(Math.sqrt((1+e)/(1-e)) * Math.tan(E/2));

    // Radius vector, in AU.
    var r = a * (1 - e*e) / (1 + e * cos(v)) * PIXELS_PER_AU;

    // Heliocentric coords.
    var X = r * (cos(o) * cos(v + p - o) - sin(o) * sin(v + p - o) * cos(i))
    var Y = r * (sin(o) * cos(v + p - o) + cos(o) * sin(v + p - o) * cos(i))
    var Z = r * (sin(v + p - o) * sin(i))
    var ret = [X, Y, Z];
    return ret;
  }

  Orbit3D.prototype.getEllipse = function() {
    if (!this.ellipse)
      this.ellipse = this.CreateOrbit(this.opts.jed);
    return this.ellipse;
  }

  Orbit3D.prototype.getParticle = function() {
    return this.particle;
  }

  window.Orbit3D = Orbit3D;
})();
